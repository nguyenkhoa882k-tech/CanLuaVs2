# PowerShell script to add sound file to iOS project
# Usage: .\add-sound-file.ps1

$SOUND_FILE = "mixkit-modern-classic-door-bell-sound-113.wav"
$SOURCE_PATH = "..\android\app\src\main\res\raw\$SOUND_FILE"
$DEST_PATH = "CanLuaVs2\$SOUND_FILE"

Write-Host "Adding sound file to iOS project..." -ForegroundColor Cyan

# Check if source file exists
if (-Not (Test-Path $SOURCE_PATH)) {
    Write-Host "Error: Sound file not found at $SOURCE_PATH" -ForegroundColor Red
    Write-Host "Please make sure the file exists in android\app\src\main\res\raw\" -ForegroundColor Yellow
    exit 1
}

# Copy file to iOS project
Write-Host "Copying $SOUND_FILE to $DEST_PATH..." -ForegroundColor Yellow
Copy-Item -Path $SOURCE_PATH -Destination $DEST_PATH -Force

if ($?) {
    Write-Host "`n✅ File copied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open Xcode: open CanLuaVs2.xcworkspace" -ForegroundColor White
    Write-Host "2. Right-click on 'CanLuaVs2' folder in Xcode" -ForegroundColor White
    Write-Host "3. Select 'Add Files to CanLuaVs2...'" -ForegroundColor White
    Write-Host "4. Select the file: $SOUND_FILE" -ForegroundColor White
    Write-Host "5. Make sure 'Copy items if needed' is checked" -ForegroundColor White
    Write-Host "6. Make sure 'Add to targets: CanLuaVs2' is checked" -ForegroundColor White
    Write-Host "7. Click 'Add'" -ForegroundColor White
    Write-Host "8. Build and run: npx react-native run-ios" -ForegroundColor White
    Write-Host ""
    Write-Host "File location: $DEST_PATH" -ForegroundColor Green
} else {
    Write-Host "❌ Error copying file" -ForegroundColor Red
    exit 1
}
