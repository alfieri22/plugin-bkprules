# Changelog

## [0.2.0] - 2026-09-05

### Changed

- Repositorio convertido de plugin Cursor (hooks) para **extensao VS Code/Cursor** com FileSystemWatcher
- Backup automatico continuo sem depender de `/sync-now` ou hooks do agent

### Added

- Fluxo "nao achei .cursor — quer criar?"
- Comando `BKPrules: Criar pasta .cursor no projeto`
- Setting `bkprules.offerCreateCursor`
- Empacotamento `.vsix` via `npm run package`

## [0.1.0] - 2026-08-20

### Added

- MVP da extensao BKPrules (origem do codigo)
- Backup automatico, wizard, settings e status bar
