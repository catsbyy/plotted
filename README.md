# Plotted

Turn any chess game into a poster. Paste a PGN, pick a style, download your art.

![Plotted](./screenshots/hero.png)

[Try it live](https://plotted-eight.vercel.app)

---

## Examples

| Neon                                                        | Ink on Paper                                              |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| ![Neon style](./screenshots/square-neon-poster-example.png) | ![Ink style](./screenshots/square-ink-poster-example.png) |

| Blueprint                                                             | Watercolour                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ![Blueprint style](./screenshots/square-blueprint-poster-example.png) | ![Watercolour style](./screenshots/square-watercolour-poster-example.png) |

---

## Features

- **4 visual styles** — Neon, Ink on Paper, Blueprint, Watercolour
- **3 export formats** — Square (2048×2048), Portrait (A4 print), Landscape (wallpaper)
- **Move visualisation** — line weight and colour encode piece type and game phase
- **Special markers** — captures, castling, and checkmate highlighted distinctly
- **High-res PNG export** — render at full resolution, download instantly
- Poster mode includes player names, opening, result, and full move notation

---

## How to use

1. **Paste a PGN** — export from Chess.com or Lichess and paste it into the input panel
2. **Choose a style and format** — pick a visual theme and output shape
3. **Download** — click _Download PNG_ to save the full-resolution artwork

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
