import * as vscode from 'vscode';
import { BackupManager } from './backupManager';
import {
  getConfig,
  setAddToGitignore,
  setBackupRoot,
  setEnabled,
} from './config';
import { Logger } from './logger';

let manager: BackupManager | undefined;
let logger: Logger | undefined;
let statusBar: vscode.StatusBarItem | undefined;
const SETUP_DONE_KEY = 'bkprules.setupDone';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logger = new Logger();
  manager = new BackupManager(logger, context);

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'bkprules.configureBackupRoot';
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.commands.registerCommand('bkprules.configureBackupRoot', () =>
      runConfigureWizard(context)
    ),
    vscode.commands.registerCommand('bkprules.syncNow', async () => {
      await manager?.syncAllNow();
      vscode.window.showInformationMessage('BKPrules: sincronizacao concluida.');
    }),
    vscode.commands.registerCommand('bkprules.addToGitignore', async () => {
      const count = await manager?.applyGitignoreToAllOpenFolders();
      vscode.window.showInformationMessage(
        'BKPrules: .cursor/ adicionado em ' + String(count ?? 0) + ' projeto(s).'
      );
    }),
    vscode.commands.registerCommand('bkprules.toggleEnabled', async () => {
      const config = getConfig();
      await setEnabled(!config.enabled);
      await manager?.refreshAll();
      updateStatusBar();
    }),
    vscode.commands.registerCommand('bkprules.createCursorFolder', async () => {
      const count = await manager?.createCursorInAllOpenFoldersMissing();
      vscode.window.showInformationMessage(
        'BKPrules: pasta .cursor criada em ' + String(count ?? 0) + ' projeto(s).'
      );
      updateStatusBar();
    }),
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('bkprules')) {
        await manager?.refreshAll();
        updateStatusBar();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      await manager?.refreshAll();
      updateStatusBar();
    })
  );

  context.subscriptions.push({ dispose: () => logger?.dispose() });

  await ensureSetup(context);
  await manager.startAll();
  updateStatusBar();

  logger.log('INFO', 'BKPrules ativado');
}

export async function deactivate(): Promise<void> {
  await manager?.stopAll();
  statusBar?.dispose();
}

async function ensureSetup(context: vscode.ExtensionContext): Promise<void> {
  const config = getConfig();
  if (config.backupRoot) {
    return;
  }

  const setupDone = context.globalState.get<boolean>(SETUP_DONE_KEY, false);
  if (setupDone) {
    return;
  }

  const choice = await vscode.window.showInformationMessage(
    'BKPrules: escolha a pasta na sua maquina onde os backups da pasta .cursor serao salvos.',
    'Configurar agora',
    'Depois'
  );

  if (choice === 'Configurar agora') {
    await runConfigureWizard(context);
  } else {
    await context.globalState.update(SETUP_DONE_KEY, true);
  }
}

async function runConfigureWizard(
  context: vscode.ExtensionContext
): Promise<void> {
  const folder = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Selecionar pasta de backup',
  });

  if (!folder?.[0]) {
    return;
  }

  const addGitignore = await vscode.window.showQuickPick(
    [
      { label: 'Sim', value: true },
      { label: 'Nao', value: false },
    ],
    {
      placeHolder: 'Adicionar .cursor/ ao .gitignore dos projetos abertos?',
    }
  );

  await setBackupRoot(folder[0].fsPath);
  if (addGitignore) {
    await setAddToGitignore(addGitignore.value);
  }
  await context.globalState.update(SETUP_DONE_KEY, true);

  await manager?.refreshAll();
  updateStatusBar();

  const dest = folder[0].fsPath + '/.bkprules/';
  vscode.window.showInformationMessage('BKPrules: backups em ' + dest);
}

function updateStatusBar(): void {
  if (!statusBar || !manager) {
    return;
  }

  const config = getConfig();
  if (!config.enabled || manager.isPaused()) {
    statusBar.text = '$(circle-slash) BKPrules: pausado';
    statusBar.tooltip = 'Clique para configurar ou ativar';
    statusBar.show();
    return;
  }

  if (!config.backupRoot) {
    statusBar.text = '$(warning) BKPrules: configure backup';
    statusBar.tooltip = 'Clique para escolher a pasta de backup';
    statusBar.show();
    return;
  }

  statusBar.text = '$(check) BKPrules: ' + manager.activeCount + ' projeto(s)';
  statusBar.tooltip = 'Backup ativo em ' + config.backupRoot + '/.bkprules/';
  statusBar.show();
}
