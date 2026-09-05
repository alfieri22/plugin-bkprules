---
name: configure-backup
description: Explica como definir BACKUP_ROOT e o fallback local ~/.bkprules/config.json para o plugin BKPrules.
---

# Configure backup

Ajude o usuario a configurar o destino dos backups da pasta `.cursor`.

1. Caminho preferido: **Customize → Plugins → BKPrules → Configure**
   - `BACKUP_ROOT`: pasta na maquina (obrigatorio)
   - `ADD_TO_GITIGNORE`: `true` ou `false` (opcional)
2. Fallback para teste local: crie ou atualize `~/.bkprules/config.json`:

```json
{
  "backupRoot": "CAMINHO/ABSOLUTO/DA/PASTA",
  "addToGitignore": false
}
```

3. Nao coloque o backup dentro do repositorio do projeto.
4. Depois de configurar, rode `node ./scripts/sync.mjs --full` a partir da pasta do plugin, ou peca um `/sync-now`.
5. Confirme ao usuario o destino final: `{BACKUP_ROOT}/.bkprules/{nome-do-projeto}/`.
