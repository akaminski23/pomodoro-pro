#!/bin/bash

# This script will process the actual blue clock image into all required sizes
# Usage: ./process_blue_clock.sh [path_to_blue_clock_image.png]

if [ -z "$1" ]; then
    echo "❌ Please provide the path to the blue clock image"
    echo "Usage: ./process_blue_clock.sh /path/to/blue-clock-image.png"
    exit 1
fi

SOURCE_IMAGE="$1"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Image file not found: $SOURCE_IMAGE"
    exit 1
fi

echo "🔄 Processing blue clock image: $SOURCE_IMAGE"

# Create all required sizes using sips
echo "📏 Creating 1024x1024..."
sips -z 1024 1024 "$SOURCE_IMAGE" --out blue-clock-icon-1024.png

echo "📏 Creating 512x512..."
sips -z 512 512 "$SOURCE_IMAGE" --out blue-clock-icon-512.png

echo "📏 Creating 256x256..."
sips -z 256 256 "$SOURCE_IMAGE" --out blue-clock-icon-256.png

echo "📏 Creating 128x128..."
sips -z 128 128 "$SOURCE_IMAGE" --out blue-clock-icon-128.png

echo "📏 Creating 64x64..."
sips -z 64 64 "$SOURCE_IMAGE" --out blue-clock-icon-64.png

echo "📏 Creating 32x32..."
sips -z 32 32 "$SOURCE_IMAGE" --out blue-clock-icon-32.png

echo "📏 Creating 16x16..."
sips -z 16 16 "$SOURCE_IMAGE" --out blue-clock-icon-16.png

# Recreate iconset and .icns
echo "📦 Creating .icns bundle..."
rm -rf blue-clock-icon.iconset
mkdir blue-clock-icon.iconset

cp blue-clock-icon-16.png blue-clock-icon.iconset/icon_16x16.png
cp blue-clock-icon-32.png blue-clock-icon.iconset/icon_16x16@2x.png
cp blue-clock-icon-32.png blue-clock-icon.iconset/icon_32x32.png
cp blue-clock-icon-64.png blue-clock-icon.iconset/icon_32x32@2x.png
cp blue-clock-icon-128.png blue-clock-icon.iconset/icon_128x128.png
cp blue-clock-icon-256.png blue-clock-icon.iconset/icon_128x128@2x.png
cp blue-clock-icon-256.png blue-clock-icon.iconset/icon_256x256.png
cp blue-clock-icon-512.png blue-clock-icon.iconset/icon_256x256@2x.png
cp blue-clock-icon-512.png blue-clock-icon.iconset/icon_512x512.png
cp blue-clock-icon-1024.png blue-clock-icon.iconset/icon_512x512@2x.png

iconutil -c icns blue-clock-icon.iconset

echo "✅ All blue clock icon sizes created!"
echo "📁 Files created:"
ls -la blue-clock-icon-*.png blue-clock-icon.icns

echo ""
echo "🚀 Now run: cd ../../ && npm run build && npm run deploy"
