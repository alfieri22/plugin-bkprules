import * as vscode from 'vscode';

export type LogAction =
  | 'INIT'
  | 'SYNC-FILE'
  | 'SYNC-DIR'
  | 'SYNC-DELETE'
  | 'CREATED'
  | 'CHANGED'
  | 'DELETED'
  | 'RENAMED'
  | 'WATCH'
  | 'STOP'
  | 'SKIP'
  | 'ERROR'
  | 'INFO';

export class Logger {
  private readonly channel: vscode.OutputChannel;

  constructor() {
    this.channel = vscode.window.createOutputChannel('BKPrules');
  }

  log(action: LogAction, message: string): void {
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    this.channel.appendLine(`[${stamp}] [${action}] ${message}`);
  }

  show(): void {
    this.channel.show(true);
  }

  dispose(): void {
    this.channel.dispose();
  }
}
