"use client";

import { useMemo, useRef, useState } from "react";
import { ChessArtCanvas, type ChessArtCanvasHandle } from "@/components/ChessArtCanvas";
import { parsePgn, type ArtStyle, type Format } from "@/lib/chessArt";

export default function Home() {
  const canvasRef = useRef<ChessArtCanvasHandle | null>(null);
  const [pgn, setPgn] = useState<string>(`[Event "Simultan"]
[Site "London (England)"]
[Date "1859.??.??"]
[Round "?"]
[White "Morphy Paul"]
[Black "Barnes Thomas W (ENG)"]
[Result "0-1"]
[ECO "C42"]
[WhiteElo "2680"]
[BlackElo "0"]
[Annotator ""]
[Source ""]
[Remark ""]
[WhiteUrl "https://images.chesscomfiles.com/uploads/v1/master_player/bfa65f34-bd81-11e8-9ae7-f3264e389a8a.75bb8ed3.50x50o.5ff55bf40407.jpeg"]
[WhiteCountry ""]
[WhiteTitle ""]
[BlackUrl ""]
[BlackCountry ""]
[BlackTitle ""]
[Link "https://www.chess.com/analysis/game/master/795/games"]

1. e4 e5 2. Nf3 Nf6 3. Bc4 Nxe4 4. Nc3 Nxc3 5. dxc3 f6 6. O-O Qe7 7. Nh4 d6 8.
Qh5+ Kd8 9. f4 Be6 10. Bxe6 Qxe6 11. fxe5 dxe5 12. Ng6 Bc5+ 13. Kh1 Re8 14. Qxh7
Qg8 15. Qh5 Nd7 16. b4 Bd6 17. Bd2 Qf7 18. Qg4 Qe6 19. Qe4 Nb6 20. Qxb7 Qg4 21.
a4 Rc8 22. Rad1 Qxg6 23. Be3 Nc4 24. Qc6 Qf7 25. Bxa7 e4 26. Rd4 Qh5 27. Rf4 e3
28. g4 e2 29. gxh5 e1=Q+ 30. Kg2 Re2+ 31. Kh3 f5 32. Qxc4 Qf1+ 33. Kh4 Rxh2+ 34.
Kg5 Qg2+ 35. Rg4 fxg4 36. Qf7 Qc6 37. b5 Qd7 38. Rxd6 Qxd6 0-1`);
  const [format, setFormat] = useState<Format>("square");
  const [style, setStyle] = useState<ArtStyle>("neon");
  const [error, setError] = useState<string | null>(null);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [pgnHelpOpen, setPgnHelpOpen] = useState(false);

  useMemo(() => {
    try {
      const g = parsePgn(pgn);
      setMovesCount(g.moves.length);
      setError(null);
    } catch (e) {
      setMovesCount(0);
      setError(e instanceof Error ? e.message : "Failed to parse PGN.");
    }
  }, [pgn]);

  return (
    <div className="min-h-screen bg-[radial-gradient(80%_80%_at_50%_20%,rgba(99,102,241,0.18),rgba(0,0,0,0))] px-4 py-8 text-zinc-900 dark:bg-[radial-gradient(80%_80%_at_50%_20%,rgba(99,102,241,0.22),rgba(0,0,0,0))] dark:text-zinc-100 sm:px-6 sm:py-10 md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            PGN → Poster Art
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Plotted
          </h1>
          <p className="max-w-2xl text-pretty text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Turn any chess game into a poster. Paste a PGN, choose a style, download your art.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight">PGN</h2>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                {error ? "Invalid PGN" : `Parsed ${movesCount} half-moves`}
              </div>
            </div>

            <textarea
              value={pgn}
              onChange={(e) => setPgn(e.target.value)}
              spellCheck={false}
              className="mt-3 h-64 w-full resize-none rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 font-mono text-xs leading-5 text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-black/30 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
              placeholder="Paste PGN here…"
            />

            <div className="mt-2">
              <button
                type="button"
                onClick={() => setPgnHelpOpen((v) => !v)}
                className="flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`transition-transform duration-200 ${pgnHelpOpen ? "rotate-90" : ""}`}
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 4.293a1 1 0 011.414 0L14 9.586a1 1 0 010 1.414L8.707 15.707a1 1 0 01-1.414-1.414L11.586 11H3a1 1 0 110-2h8.586L7.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                How to export your PGN
              </button>

              {pgnHelpOpen && (
                <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs leading-5 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                  <p className="mb-1 font-semibold text-zinc-700 dark:text-zinc-200">Chess.com</p>
                  <ol className="mb-3 list-inside list-decimal space-y-0.5">
                    <li>Open any game from your profile or the Analysis page</li>
                    <li>Click the <span className="font-medium">⋯ menu</span> (top-right of the board)</li>
                    <li>Select <span className="font-medium">Share &amp; Export → Export PGN</span></li>
                    <li>Copy all the text and paste it above</li>
                  </ol>
                  <p className="mb-1 font-semibold text-zinc-700 dark:text-zinc-200">Lichess</p>
                  <ol className="list-inside list-decimal space-y-0.5">
                    <li>Open a game from your profile</li>
                    <li>Click <span className="font-medium">FEN &amp; PGN</span> in the left panel</li>
                    <li>Copy the PGN section and paste it above</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as Format)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:ring-indigo-500/20"
                  >
                    <option value="square">Square (2048 × 2048)</option>
                    <option value="portrait">Portrait (A4 print)</option>
                    <option value="landscape">Landscape (wallpaper)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as ArtStyle)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:ring-indigo-500/20"
                  >
                    <option value="neon">Neon</option>
                    <option value="ink">Ink on Paper</option>
                    <option value="blueprint">Blueprint</option>
                    <option value="watercolor">Watercolour</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => canvasRef.current?.downloadPng()}
                disabled={!!error}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 sm:w-auto"
              >
                Download PNG
              </button>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight">Poster</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Opening name is inferred from PGN tags.</p>
            </div>
            <div className="mt-3">
              <ChessArtCanvas ref={canvasRef} pgn={pgn} format={format} style={style} />
            </div>
          </section>
        </div>

        <footer className="mx-auto mt-16 w-full max-w-6xl flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 pb-10">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Plotted © 2026
          </span>
          <a
            href="https://github.com/YOUR_USERNAME/YOUR_REPO"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-zinc-400 transition hover:text-zinc-200 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </footer>
      </div>
    </div>
  );
}
