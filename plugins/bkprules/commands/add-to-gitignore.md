---
name: add-to-gitignore
description: Adiciona .cursor/ ao .gitignore dos workspaces abertos, se a regra ainda nao existir.
---

# Add .cursor to gitignore

Adicione `.cursor/` ao `.gitignore` sem duplicar a regra.

1. Resolva a pasta do plugin `bkprules`.
2. Execute a partir da raiz do plugin, passando a pasta do projeto se necessario:

```bash
node ./scripts/gitignore.mjs
```

Ou, com caminho explicito:

```bash
node ./scripts/gitignore.mjs CAMINHO/DO/PROJETO
```

3. O script so escreve se `.cursor` / `.cursor/` ainda nao estiver no arquivo. O bloco inserido e:

```
# Cursor local rules (BKPrules)
.cursor/
```

4. Nao faca commit automaticamente. Informe quantos projetos foram atualizados.
