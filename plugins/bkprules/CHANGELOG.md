# Changelog

## [0.1.0] - 2026-09-05

### Added

- Plugin Cursor BKPrules no formato do marketplace
- Backup de `{projeto}/.cursor/` para `{BACKUP_ROOT}/.bkprules/{nome-projeto}/`
- Hooks: workspaceOpen, sessionStart, sessionEnd, afterFileEdit, afterTabFileEdit
- Variaveis `BACKUP_ROOT` e `ADD_TO_GITIGNORE`
- Commands: sync-now, configure-backup, add-to-gitignore
- Skill `bkprules-backup`
- Hash anti-colisao para projetos com o mesmo nome de pasta
