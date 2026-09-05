---
name: sync-now
description: Sincroniza agora o backup da pasta .cursor do projeto aberto para BACKUP_ROOT/.bkprules.
---

# Sync now

Rode o script de sync completo do plugin BKPrules. Nao altere arquivos do projeto.

1. Resolva a pasta do plugin `bkprules` (instalacao local em `~/.cursor/plugins/local/bkprules` ou o diretorio do plugin instalado).
2. Execute a partir da raiz do plugin:

```bash
node ./scripts/sync.mjs --full
```

3. Se `BACKUP_ROOT` ainda nao estiver definido, peca ao usuario para configurar em Customize → Plugins → BKPrules, ou escreva `~/.bkprules/config.json` com `{ "backupRoot": "CAMINHO" }`.
4. Informe o resultado com base no stderr do script (INIT, SYNC-FILE, SKIP, ERROR).
