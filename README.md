# <img src="./public/plotted-icon.svg" alt="" width="32" height="32" style="vertical-align:middle"> Plotted

Turn any chess game into a poster. Paste a PGN, pick a style, download your art.

![Plotted](./screenshots/hero.png)

[Try it live](https://plottedart.com/)

---

## Examples

| Neon                                                        | Ink on Paper                                              |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| ![Neon style](./screenshots/square-neon-poster-example.png) | ![Ink style](./screenshots/square-ink-poster-example.png) |

| Blueprint                                                             | Watercolour                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ![Blueprint style](./screenshots/square-blueprint-poster-example.png) | ![Watercolour style](./screenshots/square-watercolour-poster-example.png) |

| Monochrome                                                              | Retro                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| ![Monochrome style](./screenshots/square-monochrome-poster-example.png) | ![Retro style](./screenshots/square-retro-poster-example.png) |

---

## Drawing Animation Preview

<img src="./screenshots/drawing-animation.gif" width="500" />

## Themes

| Dark mode                             | Light mode                                    |
| ------------------------------------- | --------------------------------------------- |
| ![Dark theme](./screenshots/hero.png) | ![Light theme](./screenshots/light-theme.png) |

## Features

- **6 visual styles** — Neon, Ink on Paper, Blueprint, Watercolour, Monochrome, Retro
- **Light & dark themes** — switch between clean minimal light mode and immersive dark mode
- **Animated playback** — progressive line drawing with full timeline control:

  - Play / Pause
  - Scrub through moves like a video
  - 4 playback speeds: _Slow, Normal, Fast, Very Fast_

- **3 export formats** — Square (2048×2048), Portrait (A4 print), Landscape (wallpaper)
- **Move visualisation** — line weight and colour encode piece type and game phase
- **Special markers** — captures, castling, and checkmate highlighted distinctly
- **High-res PNG export** — render at full resolution, download instantly

- **Poster mode** includes:
  - Player names
  - Opening
  - Result
  - Full move notation

---

## How to use

1. **Paste a PGN** — export from Chess.com or Lichess and paste it into the input panel
2. **Choose a style and format** — experiment with visual themes and output shapes
3. **Play the game** — watch moves unfold as an animation
4. **Download** — click _Download PNG_ to save the full-resolution artwork

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech stack

|             |                         |
| ----------- | ----------------------- |
| Framework   | Next.js 15 (App Router) |
| Language    | TypeScript              |
| Styling     | Tailwind CSS            |
| Chess logic | chess.js                |
| Rendering   | HTML Canvas API         |

---

## License

MIT
