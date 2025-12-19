# Script de Deploy Local para GitHub Pages
# Execute: .\deploy-local.ps1

Write-Host "🚀 Iniciando deploy local..." -ForegroundColor Green

# 1. Ir para frontend
Write-Host "`n📦 Fazendo build do frontend..." -ForegroundColor Yellow
Set-Location frontend

# 2. Instalar dependências se necessário
if (-not (Test-Path node_modules)) {
    Write-Host "Instalando dependências..." -ForegroundColor Cyan
    npm install
}

# 3. Build com base URL correto
$env:VITE_BASE_URL = "/FMD-main/"
$env:NODE_ENV = "production"
npm run build:ci

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 4. Voltar para raiz
Set-Location ..

# 5. Criar pasta docs
Write-Host "`n📁 Criando pasta docs..." -ForegroundColor Yellow
if (Test-Path docs) {
    Remove-Item -Recurse -Force docs
    Write-Host "Pasta docs antiga removida" -ForegroundColor Cyan
}

# 6. Copiar arquivos
Copy-Item -Recurse frontend/dist docs
New-Item -Path docs/.nojekyll -ItemType File -Force | Out-Null

# 7. Verificar
Write-Host "`n✅ Verificando arquivos..." -ForegroundColor Green
if (Test-Path docs/index.html) {
    Write-Host "✓ index.html existe" -ForegroundColor Green
} else {
    Write-Host "✗ index.html NÃO existe!" -ForegroundColor Red
    exit 1
}

if (Test-Path docs/.nojekyll) {
    Write-Host "✓ .nojekyll existe" -ForegroundColor Green
} else {
    Write-Host "✗ .nojekyll NÃO existe!" -ForegroundColor Red
}

Write-Host "`n📊 Conteúdo da pasta docs:" -ForegroundColor Cyan
Get-ChildItem docs | Select-Object Name, Length | Format-Table

# 8. Git add e commit
Write-Host "`n📝 Preparando commit..." -ForegroundColor Yellow
git add docs/

$status = git status --porcelain docs/
if ($status) {
    Write-Host "Arquivos prontos para commit" -ForegroundColor Green
    Write-Host "`n💡 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. git commit -m 'Deploy: Add frontend build to docs folder'" -ForegroundColor White
    Write-Host "2. git push origin main" -ForegroundColor White
    Write-Host "`n3. No GitHub: Settings > Pages > Folder: /docs" -ForegroundColor White
    Write-Host "4. Aguarde 2-3 minutos e acesse: https://kceryeus.github.io/FMD-main/" -ForegroundColor White
} else {
    Write-Host "Nenhuma mudança para commitar" -ForegroundColor Yellow
}

Write-Host "`n✅ Deploy local concluído!" -ForegroundColor Green

