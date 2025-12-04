# Script to trigger Vercel webhook manually
# Use this if auto-deploy is not working

Write-Host "🚀 Triggering Vercel Redeploy..." -ForegroundColor Cyan

# Method 1: Empty commit with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit --allow-empty -m "chore: force Vercel redeploy at $timestamp"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Empty commit created" -ForegroundColor Green
    
    # Push to remote
    git push origin release/attendance-production-ready-v2
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pushed to GitHub successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "⏳ Waiting for Vercel webhook..." -ForegroundColor Yellow
        Write-Host "   Check: https://vercel.com/dashboard" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Open Vercel dashboard" -ForegroundColor White
        Write-Host "   2. Check 'Deployments' tab" -ForegroundColor White
        Write-Host "   3. Wait for build to complete (2-5 min)" -ForegroundColor White
        Write-Host "   4. Hard refresh browser: Ctrl+Shift+R" -ForegroundColor White
        Write-Host ""
        Write-Host "🔍 Expected logs in browser console:" -ForegroundColor Cyan
        Write-Host "   [Background Analyzer] 🔄 Cache DISABLED..." -ForegroundColor Green
        Write-Host "   [Location Config] ✅ Loaded from DB: {latitude: -6.864733...}" -ForegroundColor Green
    } else {
        Write-Host "❌ Push failed!" -ForegroundColor Red
        Write-Host "   Try: git push origin release/attendance-production-ready-v2 --force" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 If auto-deploy still not working:" -ForegroundColor Yellow
Write-Host "   See: FORCE_VERCEL_REDEPLOY.md for manual steps" -ForegroundColor White
