---
name: bkprules-backup
description: Configura e sincroniza o backup local da pasta .cursor (rules, commands, hooks) com o plugin BKPrules. Use when the user mentions backup of .cursor, BKPrules, BACKUP_ROOT, sync-now, or adding .cursor to gitignore.
---

# BKPrules backup

Espelha `{projeto}/.cursor/` para `{BACKUP_ROOT}/.bkprules/{nome-do-projeto}/`. O fluxo e unidirecional: nunca escreve do backup de volta no projeto.

## Quando usar

- Configurar a pasta de backup
- Sincronizar agora
- Adicionar `.cursor/` ao `.gitignore`
- Diagnosticar por que o backup nao rodou

## Configuracao

Ordem de resolucao de `BACKUP_ROOT`:

1. Variavel do plugin em Customize → Plugins → BKPrules (`BACKUP_ROOT`)
2. `~/.bkprules/config.json` → `backupRoot`
3. Se vazio, o script faz no-op e registra SKIP

`ADD_TO_GITIGNORE=true` faz o sync completo tambem atualizar o `.gitignore`.

## Como sincronizar

A partir da raiz do plugin:

```bash
node ./scripts/sync.mjs --full
node ./scripts/sync.mjs --incremental
node ./scripts/gitignore.mjs
```

Hooks ja cobrem `workspaceOpen`, `sessionStart`, `sessionEnd` (full) e `afterFileEdit` / `afterTabFileEdit` (incremental so para arquivos em `.cursor/`).

## Regras

- Nao copie o backup para dentro do repositorio do usuario
- Nao altere arquivos do projeto, exceto `.gitignore` quando pedido
- Projetos com o mesmo nome de pasta recebem sufixo hash de 4 caracteres
- Logs vao para stderr (`INIT`, `SYNC-FILE`, `SKIP`, `ERROR`)
