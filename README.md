# BKPrules

Extensao para **Cursor / VS Code** que faz backup **automatico** da pasta `.cursor` de cada projeto aberto (rules, commands, hooks, etc.) para um local seguro na sua maquina.

Nao precisa rodar sync manual: apos configurar a pasta de backup, qualquer criacao/edicao/exclusao em `.cursor` e espelhada em tempo real.

## O que faz

1. Na primeira ativacao, pede a **pasta de backup** e se deve adicionar `.cursor/` ao `.gitignore`
2. Ao abrir um projeto (pasta unica, multi-root ou workspace):
   - Se existir `.cursor` → inicia observacao continua e faz sync inicial
   - Se **nao** existir → pergunta se deseja **criar** a pasta `.cursor`
3. Espelha `{projeto}/.cursor/` → `{backupRoot}/.bkprules/{nome-do-projeto}/`
4. Multi-projeto: cada pasta aberta tem seu proprio destino (nome do projeto; hash se houver colisao)
5. Fluxo unidirecional: nunca altera o projeto a partir do backup

## Instalacao local (VSIX)

```bash
npm install
npm run compile
npm run package
```

Isso gera `bkprules-0.2.0.vsix`. No Cursor:

1. `Ctrl+Shift+P` → **Extensions: Install from VSIX...**
2. Selecione o arquivo `.vsix`
3. Recarregue a janela se pedido

Se voce testou antes o plugin Local em `~/.cursor/plugins/local/bkprules`, desinstale/remova essa pasta para nao misturar os dois formatos.

## Configuracao

| Setting | Descricao |
|---|---|
| `bkprules.enabled` | Liga/desliga (default: `true`) |
| `bkprules.backupRoot` | Pasta de destino dos backups |
| `bkprules.addToGitignore` | Adiciona `.cursor/` ao `.gitignore` |
| `bkprules.offerCreateCursor` | Pergunta se deve criar `.cursor` quando faltar |
| `bkprules.debounceMs` | Debounce dos eventos de arquivo (default: 400) |

Comandos uteis:

- **BKPrules: Configurar pasta de backup**
- **BKPrules: Criar pasta .cursor no projeto**
- **BKPrules: Sincronizar agora** (opcional; o watcher ja cobre o dia a dia)
- **BKPrules: Adicionar .cursor ao .gitignore**
- **BKPrules: Ativar/Desativar backup**

## Desenvolvimento

```bash
npm install
npm run compile
npm run watch
```

Pressione **F5** no Cursor/VS Code para abrir o Extension Development Host.

## Licenca

MIT
