"use client";

import { useMemo, useRef, useState } from "react";
import { ChessArtCanvas, type ChessArtCanvasHandle } from "@/components/ChessArtCanvas";
import { parsePgn } from "@/lib/chessArt";

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
  const [size, setSize] = useState<1024 | 2048>(2048);
  const [error, setError] = useState<string | null>(null);
  const [movesCount, setMovesCount] = useState<number>(0);

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
    <div className="min-h-screen bg-[radial-gradient(80%_80%_at_50%_20%,rgba(99,102,241,0.18),rgba(0,0,0,0))] px-6 py-10 text-zinc-900 dark:bg-[radial-gradient(80%_80%_at_50%_20%,rgba(99,102,241,0.22),rgba(0,0,0,0))] dark:text-zinc-100 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            PGN → Poster Art
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Chess Art Generator</h1>
          <p className="max-w-2xl text-pretty text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Paste a PGN and export a poster-style generative artwork. Legend includes time gradient, captures, and
            castling.
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

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Output</label>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value) as 1024 | 2048)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:ring-indigo-500/20"
                >
                  <option value={1024}>1024×1024</option>
                  <option value={2048}>2048×2048</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => canvasRef.current?.downloadPng()}
                  disabled={!!error}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  Download PNG
                </button>
              </div>
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
              <ChessArtCanvas ref={canvasRef} pgn={pgn} size={size} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
