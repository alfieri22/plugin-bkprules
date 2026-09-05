# BKPrules

Plugin Cursor que faz backup automatico da pasta `.cursor` de cada projeto aberto (rules, commands, hooks, etc.) para um local seguro na sua maquina.

## O que faz

- Detecta `{projeto}/.cursor/` na raiz de cada workspace
- Espelha o conteudo para `{BACKUP_ROOT}/.bkprules/{nome-do-projeto}/`
- Fluxo unidirecional: nunca altera seus projetos a partir do backup
- Hash anti-colisao quando dois projetos tem o mesmo nome de pasta
- Opcional: adiciona `.cursor/` ao `.gitignore`

## Configuracao

1. Instale o plugin (Customize ou marketplace)
2. Em **Customize → Plugins → BKPrules → Configure**, defina `BACKUP_ROOT`
3. Opcional: defina `ADD_TO_GITIGNORE` como `true`
4. Abra um projeto com pasta `.cursor` — o backup roda nos hooks do Cursor

Fallback local para testes: crie `~/.bkprules/config.json`:

```json
{
  "backupRoot": "D:/Backups",
  "addToGitignore": false
}
```

## Quando o sync roda

| Evento | Tipo |
|---|---|
| `workspaceOpen`, `sessionStart`, `sessionEnd` | Sync completo |
| `afterFileEdit`, `afterTabFileEdit` | Incremental (so arquivos em `.cursor/`) |
| Comando `/sync-now` | Sync completo manual |

Edicoes manuais fora desses eventos entram no backup no proximo open/session ou no comando `/sync-now`.

Este plugin **nao** inclui status bar nem watcher persistente de filesystem (isso existe so na extensao VS Code em `BKPrules`).

## Commands

- `/sync-now` — sincroniza agora
- `/configure-backup` — como definir `BACKUP_ROOT`
- `/add-to-gitignore` — adiciona `.cursor/` ao `.gitignore`

## Requisitos

Node.js no PATH. Os hooks executam `node ./scripts/sync.mjs`.

## Licenca

MIT
