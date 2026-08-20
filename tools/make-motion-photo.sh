#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 -i <input-image> -o <output-file> [-d duration-seconds] [-f fps] [-z zoom-target] [--direction in|out] [--size WxH]

  -i   Input still image (jpg/png)
  -o   Output file (.gif or .mp4)
  -d   Duration in seconds (default: 6)
  -f   Output frame rate (default: 25)
  -z   Max zoom factor, e.g. 1.3 (default: 1.2)
  --direction   "in" (zoom in) or "out" (zoom out) (default: in)
  --size        Output resolution, e.g. 1280x720 (default: 1280x720)

Requires ffmpeg (brew install ffmpeg).

Examples:
  $0 -i photos/sample-1.jpg -o photos/sample-1-motion.mp4
  $0 -i photos/sample-1.jpg -o photos/sample-1-motion.gif -d 8 -z 1.4 --direction out
EOF
  exit 1
}

DURATION=6
FPS=25
ZOOM=1.2
DIRECTION="in"
SIZE="1280x720"
INPUT=""
OUTPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i) INPUT="$2"; shift 2 ;;
    -o) OUTPUT="$2"; shift 2 ;;
    -d) DURATION="$2"; shift 2 ;;
    -f) FPS="$2"; shift 2 ;;
    -z) ZOOM="$2"; shift 2 ;;
    --direction) DIRECTION="$2"; shift 2 ;;
    --size) SIZE="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $1"; usage ;;
  esac
done

[[ -z "$INPUT" || -z "$OUTPUT" ]] && usage

if [[ ! -f "$INPUT" ]]; then
  echo "Input file not found: $INPUT"
  exit 1
fi

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found. Install with: brew install ffmpeg"; exit 1; }

WIDTH="${SIZE%x*}"
HEIGHT="${SIZE#*x}"
TOTAL_FRAMES=$(( DURATION * FPS ))

if [[ "$DIRECTION" == "in" ]]; then
  ZOOM_EXPR="min(zoom+((${ZOOM}-1)/${TOTAL_FRAMES}),${ZOOM})"
elif [[ "$DIRECTION" == "out" ]]; then
  ZOOM_EXPR="if(eq(on,0),${ZOOM},max(zoom-((${ZOOM}-1)/${TOTAL_FRAMES}),1))"
else
  echo "Invalid --direction: $DIRECTION (must be 'in' or 'out')"
  exit 1
fi

FILTER="scale=8000:-1,zoompan=z='${ZOOM_EXPR}':d=${TOTAL_FRAMES}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${WIDTH}x${HEIGHT}:fps=${FPS}"

case "$OUTPUT" in
  *.gif)
    PALETTE=$(mktemp -u /tmp/palette-XXXXXX.png)
    ffmpeg -y -loop 1 -i "$INPUT" -vf "${FILTER},palettegen" -frames:v 1 "$PALETTE"
    ffmpeg -y -loop 1 -i "$INPUT" -i "$PALETTE" \
      -lavfi "${FILTER}[x];[x][1:v]paletteuse" \
      -t "$DURATION" "$OUTPUT"
    rm -f "$PALETTE"
    ;;
  *.mp4)
    ffmpeg -y -loop 1 -i "$INPUT" -vf "$FILTER" -c:v libx264 -pix_fmt yuv420p -t "$DURATION" "$OUTPUT"
    ;;
  *)
    echo "Output must end in .gif or .mp4"
    exit 1
    ;;
esac

echo "Done: $OUTPUT"
