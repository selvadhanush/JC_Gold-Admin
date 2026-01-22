$filePath = "node_modules\metro-config\src\loadConfig.js"
$content = Get-Content $filePath -Raw

# Replace the import statement with the Windows-compatible version
$pattern = 'const configModule = await import\(absolutePath\);'
$replacement = 'const configModule = await import(process.platform === "win32" ? require("url").pathToFileURL(absolutePath).href : absolutePath);'

$content = $content -replace [regex]::Escape($pattern), $replacement

Set-Content $filePath -Value $content -NoNewline
Write-Host "Patch applied successfully!"
