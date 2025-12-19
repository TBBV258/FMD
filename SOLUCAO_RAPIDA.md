# 🚀 Solução Rápida - Deploy Manual

Se o workflow automático não estiver funcionando, faça o deploy manualmente:

## Opção 1: Deploy Manual Local (Mais Rápido)

Execute estes comandos no terminal:

```bash
# 1. Ir para o frontend
cd frontend

# 2. Instalar dependências (se ainda não instalou)
npm install

# 3. Fazer build com base URL correto
$env:VITE_BASE_URL="/FMD-main/"; npm run build

# 4. Voltar para raiz
cd ..

# 5. Criar pasta docs e copiar arquivos
if (Test-Path docs) { Remove-Item -Recurse -Force docs }
Copy-Item -Recurse frontend/dist docs
New-Item -Path docs/.nojekyll -ItemType File -Force

# 6. Verificar se foi criado
ls docs/

# 7. Commit e push
git add docs/
git commit -m "Deploy: Add frontend build to docs folder"
git push origin main
```

## Opção 2: Verificar Configuração do GitHub Pages

1. **Settings** → **Pages**
2. **Source**: `main` branch
3. **Folder**: `/docs` (não `/ (root)`)
4. **Save**

## Opção 3: Verificar se a Pasta docs Existe no GitHub

1. No GitHub, vá para o repositório
2. Verifique se existe uma pasta `docs/` na raiz
3. Se não existir, o workflow não executou ou falhou
4. Execute a Opção 1 acima

## ✅ Após Fazer o Deploy

1. Aguarde 2-3 minutos
2. Limpe o cache do navegador
3. Acesse: `https://kceryeus.github.io/FMD-main/`

## 🔍 Verificação

Se ainda não funcionar:

1. Verifique se `docs/index.html` existe no GitHub
2. Verifique se `docs/.nojekyll` existe
3. Verifique se o GitHub Pages está configurado para `/docs`
4. Verifique o console do navegador (F12) para erros

