import * as vscode from 'vscode';

export interface BkpRulesConfig {
  enabled: boolean;
  backupRoot: string;
  addToGitignore: boolean;
  debounceMs: number;
  offerCreateCursor: boolean;
}

export function getConfig(): BkpRulesConfig {
  const cfg = vscode.workspace.getConfiguration('bkprules');
  return {
    enabled: cfg.get<boolean>('enabled', true),
    backupRoot: (cfg.get<string>('backupRoot', '') || '').trim(),
    addToGitignore: cfg.get<boolean>('addToGitignore', false),
    debounceMs: cfg.get<number>('debounceMs', 400),
    offerCreateCursor: cfg.get<boolean>('offerCreateCursor', true),
  };
}

export async function setBackupRoot(value: string): Promise<void> {
  await vscode.workspace
    .getConfiguration('bkprules')
    .update('backupRoot', value, vscode.ConfigurationTarget.Global);
}

export async function setAddToGitignore(value: boolean): Promise<void> {
  await vscode.workspace
    .getConfiguration('bkprules')
    .update('addToGitignore', value, vscode.ConfigurationTarget.Global);
}

export async function setEnabled(value: boolean): Promise<void> {
  await vscode.workspace
    .getConfiguration('bkprules')
    .update('enabled', value, vscode.ConfigurationTarget.Global);
}
