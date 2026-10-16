# New logo: minimal barbell glyph

Replace the current placeholder icon with a quiet, premium barbell mark in pure monochrome — the same visual language as the rest of Lift (thin strokes, generous space, no color).

## The mark

A single perfectly horizontal bar with two compact plate blocks on each end, centered in a square with wide margins. Precise geometry, flat black on white (and inverted white on black for dark contexts). No gradients, no shadows, no text.

```text
   ▮▯ ────────── ▯▮
```

At 16px it should still read as a barbell: that means few, thick-enough shapes and heavy padding, not fine detail.

## What gets produced

- A high-resolution square master of the mark (black on white).
- A dark variant (white on black) for the iOS home-screen icon, so it sits well against the app's dark surface.
- Derived files: `public/favicon.png`, `public/icon-192.png`, `public/icon-512.png`, all square and correctly padded.

## Where it shows up

- Browser tab / favicon.
- iOS home-screen icon and PWA manifest icons (replacing the current ones).
- Optionally a small mark next to the "Hey Pedro" greeting on the home screen — say the word if you want it there; by default the home screen stays text-only to keep it calm.

## Technical notes

- Generate the master at 1024x1024, downscale with padding (no stretching) into the three public/ sizes.
- Point the root route's `head().links` icon entry at the new PNG and remove the stale `favicon.ico` so crawlers don't serve the old one.
- Manifest icon entries stay the same paths, so no manifest change is needed beyond the replaced files.
