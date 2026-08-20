# make-motion-photo.sh

Turns a still landscape photo into an animated pan/zoom ("Ken Burns") GIF or
MP4, using ffmpeg locally. Free, no account, no subscription.

## Setup (one time)

```
brew install ffmpeg
chmod +x tools/make-motion-photo.sh
```

## Usage

```
./tools/make-motion-photo.sh -i <input-image> -o <output-file> [options]
```

Options:

| Flag | Meaning | Default |
|---|---|---|
| `-i` | Input image (jpg/png) | required |
| `-o` | Output file, must end in `.gif` or `.mp4` | required |
| `-d` | Duration in seconds | 6 |
| `-f` | Frame rate | 25 |
| `-z` | Max zoom factor (e.g. 1.3 = 30% zoom) | 1.2 |
| `--direction` | `in` (zoom in) or `out` (zoom out) | in |
| `--size` | Output resolution, e.g. `1920x1080` | 1280x720 |

Examples:

```
./tools/make-motion-photo.sh -i photos/mine.jpg -o photos/mine-motion.mp4
./tools/make-motion-photo.sh -i photos/mine.jpg -o photos/mine-motion.gif -d 8 -z 1.4 --direction out
```

## Using the output in the portal

- A generated **GIF** can be dropped straight into `/photos` and referenced
  in `photos.config.js` exactly like any other image — animated GIFs play
  natively as CSS backgrounds.
- A generated **MP4** is not usable as a CSS `background-image`. Playing it
  in the portal would require adding a `<video>` background layer, which
  isn't part of the current app. MP4s are still useful on their own (e.g.
  to share, or play in QuickTime/VLC).
