# BKPrules

Backup **automático** da pasta `.cursor` (rules, commands, hooks, etc.) para um local seguro na sua máquina.

Depois de configurar a pasta de destino, qualquer criação, edição ou exclusão dentro de `.cursor` é espelhada em tempo real. Não é preciso rodar sync manual no dia a dia.

## Como instalar (arquivo `.vsix`)

1. No Cursor: `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
2. Digite e escolha **Extensions: Install from VSIX...**
3. Selecione o arquivo `bkprules-x.y.z.vsix`
4. Recarregue a janela se o Cursor pedir

## Como configurar (primeira vez)

1. Ao ativar a extensão, aparece o aviso para escolher a **pasta de backup**
2. Clique em **Configurar agora** e selecione uma pasta na sua máquina  
   (exemplo: `Documentos/BKPrules-backups`)
3. Informe se deseja adicionar `.cursor/` ao `.gitignore` dos projetos abertos
4. Pronto — o backup fica ativo

Se pulou o wizard, use o comando:

**BKPrules: Configurar pasta de backup**

Os arquivos vão para:

```text
{pasta-escolhida}/.bkprules/{nome-do-projeto}/
```

Com vários projetos abertos (ex.: web + api), cada um tem sua própria subpasta pelo nome do projeto.

## Como usar no dia a dia

1. Abra um ou mais projetos no Cursor
2. Se o projeto **já tiver** `.cursor` → o backup começa sozinho
3. Se **não tiver** `.cursor` → a extensão pergunta se deseja criar a pasta
4. Edite rules/commands normalmente — as alterações são salvas no destino configurado

A barra de status mostra algo como `BKPrules: 1 projeto(s)` quando está ativo.  
Clique nela para reabrir a configuração da pasta de backup.

### Observações importantes

- O fluxo é **só de ida**: o backup nunca altera seus projetos
- Sem pasta de backup configurada, a extensão fica pausada (`BKPrules: configure backup`)
- A pergunta “criar `.cursor`?” só aparece **depois** da pasta de backup estar definida

## Comandos

| Comando | Quando usar |
|---|---|
| **BKPrules: Configurar pasta de backup** | Definir ou mudar o destino dos backups |
| **BKPrules: Criar pasta .cursor no projeto** | Criar `.cursor` nos projetos abertos que ainda não têm |
| **BKPrules: Sincronizar agora** | Sync manual opcional (o watcher já cobre o uso normal) |
| **BKPrules: Adicionar .cursor ao .gitignore** | Incluir `.cursor/` no `.gitignore` dos projetos abertos |
| **BKPrules: Ativar/Desativar backup** | Pausar ou retomar o backup automático |

## Settings

Abra as Settings do Cursor e busque por `bkprules`:

| Setting | Descrição |
|---|---|
| `bkprules.enabled` | Liga/desliga o backup (padrão: ligado) |
| `bkprules.backupRoot` | Pasta onde os backups são salvos |
| `bkprules.addToGitignore` | Se `true`, adiciona `.cursor/` ao `.gitignore` |
| `bkprules.offerCreateCursor` | Se `true`, pergunta para criar `.cursor` quando faltar |
| `bkprules.debounceMs` | Atraso (ms) para agrupar eventos de arquivo (padrão: 400) |

## Desenvolvimento (opcional)

Só se for gerar o `.vsix` a partir do código:

```bash
npm install
npm run compile
npm run package
```

Isso gera `bkprules-x.y.z.vsix` na raiz do repositório.  
Para depurar: `npm run watch` e pressione **F5** no Cursor/VS Code.

## Licença

MIT
