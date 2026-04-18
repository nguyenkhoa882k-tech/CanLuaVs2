#!/bin/bash

# Script to add sound file to iOS project
# Usage: ./add-sound-file.sh

SOUND_FILE="mixkit-modern-classic-door-bell-sound-113.wav"
SOURCE_PATH="../android/app/src/main/res/raw/$SOUND_FILE"
DEST_PATH="CanLuaVs2/$SOUND_FILE"

echo "Adding sound file to iOS project..."

# Check if source file exists
if [ ! -f "$SOURCE_PATH" ]; then
    echo "Error: Sound file not found at $SOURCE_PATH"
    echo "Please make sure the file exists in android/app/src/main/res/raw/"
    exit 1
fi

# Copy file to iOS project
echo "Copying $SOUND_FILE to $DEST_PATH..."
cp "$SOURCE_PATH" "$DEST_PATH"

if [ $? -eq 0 ]; then
    echo "✅ File copied successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Open Xcode: open CanLuaVs2.xcworkspace"
    echo "2. Right-click on 'CanLuaVs2' folder in Xcode"
    echo "3. Select 'Add Files to CanLuaVs2...'"
    echo "4. Select the file: $SOUND_FILE"
    echo "5. Make sure 'Copy items if needed' is checked"
    echo "6. Make sure 'Add to targets: CanLuaVs2' is checked"
    echo "7. Click 'Add'"
    echo "8. Build and run: npx react-native run-ios"
else
    echo "❌ Error copying file"
    exit 1
fi
