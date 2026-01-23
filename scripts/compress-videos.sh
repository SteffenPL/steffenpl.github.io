#!/bin/bash
# Compress videos for web display
# Usage: ./scripts/compress-videos.sh [input_dir] [output_dir]
# Default: compresses src/assets/*.mp4 to src/assets/compressed/

set -e

INPUT_DIR="${1:-src/assets}"
OUTPUT_DIR="${2:-src/assets/compressed}"

# Target settings for web videos
MAX_WIDTH=720          # Max width in pixels
MAX_SIZE_MB=2          # Target max size in MB
CRF=28                 # Quality (18-28, lower = better quality, larger file)
PRESET="slow"          # Encoding preset (slower = better compression)

mkdir -p "$OUTPUT_DIR"

compress_video() {
    local input="$1"
    local filename=$(basename "$input")
    local output="$OUTPUT_DIR/$filename"

    # Get video duration
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$input")

    # Calculate target bitrate for target size (in kbps)
    # Formula: bitrate = (target_size_MB * 8192) / duration_seconds
    target_bitrate=$(echo "$MAX_SIZE_MB * 8192 / $duration" | bc)

    echo "Compressing: $filename"
    echo "  Duration: ${duration}s, Target bitrate: ${target_bitrate}k"

    ffmpeg -y -i "$input" \
        -c:v libx264 \
        -preset "$PRESET" \
        -crf "$CRF" \
        -maxrate "${target_bitrate}k" \
        -bufsize "$((target_bitrate * 2))k" \
        -vf "scale='min($MAX_WIDTH,iw)':-2" \
        -an \
        -movflags +faststart \
        -pix_fmt yuv420p \
        "$output" 2>/dev/null

    # Report sizes
    input_size=$(ls -lh "$input" | awk '{print $5}')
    output_size=$(ls -lh "$output" | awk '{print $5}')
    echo "  $input_size -> $output_size"
    echo ""
}

echo "=== Video Compression ==="
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo ""

# Compress all MP4 files
for video in "$INPUT_DIR"/*.mp4; do
    if [ -f "$video" ]; then
        compress_video "$video"
    fi
done

echo "Done! Compressed videos are in $OUTPUT_DIR"
echo ""
echo "To use compressed videos, update src/index.md paths to:"
echo "  /assets/compressed/C.mp4"
echo "  /assets/compressed/bacteria.mp4"
echo "  /assets/compressed/cells.mp4"
