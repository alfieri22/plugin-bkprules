# plugin-bkprules

Plugin para backup e reutilização das regras do Cursor. Mantém uma cópia local da pasta `.cursor`, permitindo recuperar suas regras mesmo após a exclusão do projeto ou quando `.cursor` está no `.gitignore`.

Repositório no formato oficial de plugins do Cursor. Contém o plugin **bkprules**.

A extensão VS Code original permanece em outro repositório/pasta (`BKPrules`) e não faz parte deste pacote.

## Plugin incluído

- **bkprules**: espelha `{projeto}/.cursor/` para `{BACKUP_ROOT}/.bkprules/{nome-do-projeto}/`

## Requisitos

- Node.js no PATH (os hooks e commands usam scripts `.mjs`)
- Variável `BACKUP_ROOT` configurada em **Customize → Plugins → BKPrules → Configure**

## Validação

```bash
node scripts/validate-template.mjs
```

## Teste local

1. Copie ou crie um symlink de `plugins/bkprules` para `~/.cursor/plugins/local/bkprules`
2. Execute **Developer: Reload Window**
3. Em Customize, confirme o plugin e configure `BACKUP_ROOT`

## Publicação

1. Este repositório precisa estar público no GitHub
2. Envie o link em [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish)

## Estrutura

```text
.cursor-plugin/marketplace.json
plugins/bkprules/
scripts/validate-template.mjs
```

Para adicionar outro plugin, veja [docs/add-a-plugin.md](docs/add-a-plugin.md).

## Licença

MIT
