import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { getConfig } from './config';
import { appendCursorToGitignore } from './gitignoreHelper';
import { Logger } from './logger';
import {
  mirrorFileCreatedOrChanged,
  mirrorFileDeleted,
  MirrorTarget,
  syncMirror,
} from './mirrorEngine';
import {
  getBackupDestRoot,
  resolveProjectKey,
  writeProjectMeta,
} from './projectKey';

interface ActiveSession {
  folderUri: string;
  workspacePath: string;
  target: MirrorTarget;
  watchers: vscode.FileSystemWatcher[];
  projectWatcher?: vscode.FileSystemWatcher;
}

export class BackupManager {
  private sessions = new Map<string, ActiveSession>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingRootWatchers = new Map<string, vscode.FileSystemWatcher>();
  private paused = false;

  constructor(
    private readonly logger: Logger,
    private readonly context: vscode.ExtensionContext
  ) {}

  get activeCount(): number {
    return this.sessions.size;
  }

  isPaused(): boolean {
    return this.paused;
  }

  setPaused(value: boolean): void {
    this.paused = value;
  }

  async refreshAll(): Promise<void> {
    await this.stopAll();
    await this.startAll();
  }

  async syncAllNow(): Promise<void> {
    const config = getConfig();
    if (!config.backupRoot) {
      return;
    }
    for (const session of this.sessions.values()) {
      this.logger.log('INIT', `Sincronizando ${session.target.label}`);
      await syncMirror(session.target, this.logger);
    }
  }

  async startAll(): Promise<void> {
    const config = getConfig();
    if (!config.enabled || this.paused || !config.backupRoot) {
      return;
    }

    const folders = vscode.workspace.workspaceFolders ?? [];
    for (const folder of folders) {
      await this.startForFolder(folder, config.backupRoot, config.addToGitignore);
    }
  }

  async stopAll(): Promise<void> {
    for (const key of [...this.sessions.keys()]) {
      await this.stopSession(key);
    }
    for (const [key, watcher] of this.pendingRootWatchers) {
      watcher.dispose();
      this.pendingRootWatchers.delete(key);
    }
  }

  async createCursorForFolder(folder: vscode.WorkspaceFolder): Promise<boolean> {
    const cursorDir = path.join(folder.uri.fsPath, '.cursor');
    try {
      await fs.mkdir(cursorDir, { recursive: true });
      const readmePath = path.join(cursorDir, 'README.md');
      try {
        await fs.access(readmePath);
      } catch {
        await fs.writeFile(
          readmePath,
          [
            '# .cursor',
            '',
            'Pasta local de rules, commands e hooks do Cursor.',
            'Gerenciada / observada pelo BKPrules para backup automatico.',
            '',
          ].join('\n'),
          'utf8'
        );
      }
      this.logger.log('INFO', `Pasta .cursor criada em ${cursorDir}`);
      return true;
    } catch (err) {
      this.logger.log('ERROR', `Falha ao criar .cursor: ${String(err)}`);
      vscode.window.showErrorMessage(
        'BKPrules: nao foi possivel criar a pasta .cursor.'
      );
      return false;
    }
  }

  async createCursorInAllOpenFoldersMissing(): Promise<number> {
    let created = 0;
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const cursorDir = path.join(folder.uri.fsPath, '.cursor');
      try {
        await fs.access(cursorDir);
      } catch {
        if (await this.createCursorForFolder(folder)) {
          created += 1;
        }
      }
    }
    if (created > 0) {
      await this.refreshAll();
    }
    return created;
  }

  private declineKey(folderUri: string): string {
    return `bkprules.declineCreateCursor:${folderUri}`;
  }

  private async offerCreateCursor(
    folder: vscode.WorkspaceFolder
  ): Promise<void> {
    const config = getConfig();
    if (!config.offerCreateCursor) {
      return;
    }

    const sessionKey = folder.uri.toString();
    if (this.context.workspaceState.get<boolean>(this.declineKey(sessionKey))) {
      return;
    }

    const choice = await vscode.window.showInformationMessage(
      `BKPrules: o projeto "${folder.name}" nao tem pasta .cursor. Deseja criar agora para backup automatico?`,
      'Criar .cursor',
      'Agora nao'
    );

    if (choice === 'Criar .cursor') {
      await this.createCursorForFolder(folder);
      return;
    }

    if (choice === 'Agora nao') {
      await this.context.workspaceState.update(this.declineKey(sessionKey), true);
    }
  }

  private async startForFolder(
    folder: vscode.WorkspaceFolder,
    backupRoot: string,
    addToGitignore: boolean
  ): Promise<void> {
    const workspacePath = folder.uri.fsPath;
    const sessionKey = folder.uri.toString();

    if (this.sessions.has(sessionKey)) {
      return;
    }

    const cursorDir = path.join(workspacePath, '.cursor');

    const beginSession = async (): Promise<void> => {
      try {
        await fs.access(cursorDir);
      } catch {
        return;
      }

      if (this.sessions.has(sessionKey)) {
        return;
      }

      const pending = this.pendingRootWatchers.get(sessionKey);
      if (pending) {
        // keep watching; attach to session below
      }

      const projectKey = await resolveProjectKey(workspacePath, backupRoot);
      const destRoot = getBackupDestRoot(backupRoot, projectKey);
      await writeProjectMeta(destRoot, workspacePath);

      const target: MirrorTarget = {
        sourceCursorDir: cursorDir,
        destRoot,
        label: projectKey,
      };

      this.logger.log('INIT', `Sincronizando ${projectKey} (${cursorDir})`);
      await syncMirror(target, this.logger);

      if (addToGitignore) {
        await appendCursorToGitignore(workspacePath, this.logger);
      }

      const pattern = new vscode.RelativePattern(folder, '.cursor/**');
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      watcher.onDidCreate((uri) => {
        void this.debouncedHandle(sessionKey, () =>
          mirrorFileCreatedOrChanged(target, uri.fsPath, this.logger, 'CREATED')
        );
      });
      watcher.onDidChange((uri) => {
        void this.debouncedHandle(sessionKey, () =>
          mirrorFileCreatedOrChanged(target, uri.fsPath, this.logger, 'CHANGED')
        );
      });
      watcher.onDidDelete((uri) => {
        void this.debouncedHandle(sessionKey, () =>
          mirrorFileDeleted(target, uri.fsPath, this.logger)
        );
      });

      this.context.subscriptions.push(watcher);

      let projectWatcher = this.pendingRootWatchers.get(sessionKey);
      if (!projectWatcher) {
        const rootPattern = new vscode.RelativePattern(folder, '.cursor');
        projectWatcher = vscode.workspace.createFileSystemWatcher(rootPattern);
        projectWatcher.onDidCreate(() => {
          void beginSession();
        });
        this.context.subscriptions.push(projectWatcher);
      } else {
        this.pendingRootWatchers.delete(sessionKey);
      }

      const session: ActiveSession = {
        folderUri: sessionKey,
        workspacePath,
        target,
        watchers: [watcher],
        projectWatcher,
      };
      this.sessions.set(sessionKey, session);
      this.logger.log('WATCH', cursorDir);
    };

    let cursorExists = true;
    try {
      await fs.access(cursorDir);
    } catch {
      cursorExists = false;
    }

    if (!cursorExists) {
      await this.offerCreateCursor(folder);
    }

    await beginSession();

    if (!this.sessions.has(sessionKey) && !this.pendingRootWatchers.has(sessionKey)) {
      const rootPattern = new vscode.RelativePattern(folder, '.cursor');
      const projectWatcher = vscode.workspace.createFileSystemWatcher(rootPattern);
      projectWatcher.onDidCreate(() => {
        void beginSession();
      });
      this.context.subscriptions.push(projectWatcher);
      this.pendingRootWatchers.set(sessionKey, projectWatcher);
      this.logger.log('INFO', `Aguardando .cursor em ${workspacePath}`);
    }
  }

  private debouncedHandle(
    sessionKey: string,
    fn: () => Promise<void>
  ): void {
    const config = getConfig();
    const existing = this.debounceTimers.get(sessionKey);
    if (existing) {
      clearTimeout(existing);
    }
    this.debounceTimers.set(
      sessionKey,
      setTimeout(() => {
        this.debounceTimers.delete(sessionKey);
        void fn();
      }, config.debounceMs)
    );
  }

  private async stopSession(sessionKey: string): Promise<void> {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      return;
    }
    for (const w of session.watchers) {
      w.dispose();
    }
    session.projectWatcher?.dispose();
    this.sessions.delete(sessionKey);
    this.logger.log('STOP', session.target.label);
  }

  async applyGitignoreToAllOpenFolders(): Promise<number> {
    let count = 0;
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const ok = await appendCursorToGitignore(folder.uri.fsPath, this.logger);
      if (ok) {
        count++;
      }
    }
    return count;
  }
}
