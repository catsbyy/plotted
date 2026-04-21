"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  drawChessArt,
  drawMoveAtProgress,
  formatDimensions,
  getBoardGeometry,
  getTokens,
  parsePgn,
  type ArtStyle,
  type Format,
  type ParsedGame,
} from "@/lib/chessArt";

export type ChessArtCanvasHandle = {
  downloadPng: () => void;
  play: (from: number, speed: number) => void;
  pause: () => void;
  seekTo: (n: number) => void;
};

function humanReadableResult(result: string, white: string, black: string): string {
  switch (result.trim()) {
    case "1-0":
      return `${white} won`;
    case "0-1":
      return `${black} won`;
    case "1/2-1/2":
      return "Draw";
    case "½-½":
      return "Draw";
    default:
      return "";
  }
}

function formatDateForPoster(raw: string) {
  const t = raw?.trim();
  if (!t || t === "????.??.??") return "";
  const m = t.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!m) return t;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d));
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function buildAllMoves(game: ParsedGame) {
  const out: string[] = [];
  for (let i = 0; i < game.moves.length; i++) {
    const moveNumber = Math.floor(i / 2) + 1;
    const isWhite = i % 2 === 0;
    if (isWhite) out.push(`${moveNumber}.`);
    out.push(game.moves[i].san);
  }
  return out.join(" ");
}

function deriveTitle(game: ParsedGame) {
  const event = game.tags.Event?.trim();
  const site = game.tags.Site?.trim();
  if (event && site) return `${event} • ${site}`;
  return event || site || "Chess Poster";
}

function deriveOpeningName(game: ParsedGame) {
  const opening = game.tags.Opening?.trim();
  if (opening) return opening;
  const ecoUrl = game.tags.ECOUrl?.trim();
  if (!ecoUrl) return "";
  try {
    const url = new URL(ecoUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    const decoded = decodeURIComponent(last);
    const cleaned = decoded.split(/-\d+\./)[0] ?? decoded;
    return cleaned.replaceAll("-", " ").trim();
  } catch {
    return "";
  }
}

export const ChessArtCanvas = forwardRef<
  ChessArtCanvasHandle,
  {
    pgn: string;
    format: Format;
    style: ArtStyle;
    onMoveChange?: (n: number) => void;
    onPlayEnd?: () => void;
  }
>(function ChessArtCanvas({ pgn, format, style, onMoveChange, onPlayEnd }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPlayingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest callbacks in refs so the animation closure always sees current values
  const onMoveChangeRef = useRef(onMoveChange);
  const onPlayEndRef = useRef(onPlayEnd);
  onMoveChangeRef.current = onMoveChange;
  onPlayEndRef.current = onPlayEnd;

  const { width, height } = formatDimensions(format);

  const parsed = useMemo(() => {
    try {
      return parsePgn(pgn);
    } catch {
      return null;
    }
  }, [pgn]);

  // Keep latest parsed/style/format in refs for use inside animation closures
  const parsedRef = useRef(parsed);
  parsedRef.current = parsed;
  const styleRef = useRef(style);
  styleRef.current = style;
  const widthRef = useRef(width);
  widthRef.current = width;
  const heightRef = useRef(height);
  heightRef.current = height;

  const buildPosterOptions = (game: ParsedGame, moveLimit?: number) => {
    const tags = game.tags;
    const white = tags.White?.trim() || "White";
    const black = tags.Black?.trim() || "Black";
    const { width: w, height: h } = formatDimensions(format);
    return {
      width: w,
      height: h,
      style,
      poster: {
        title: deriveTitle(game),
        subtitle: [deriveOpeningName(game) || tags.ECO?.trim(), tags.TimeControl?.trim() ? `${tags.TimeControl}s` : ""]
          .filter(Boolean)
          .join(" • "),
        white,
        black,
        result: humanReadableResult(tags.Result ?? "", white, black),
        date: formatDateForPoster(tags.Date || tags.UTCDate || ""),
        termination: tags.Termination?.trim() || "",
        movesText: buildAllMoves(game),
      },
      ...(moveLimit !== undefined ? { moveLimit } : {}),
    };
  };

  const renderAtMove = (moveLimit: number) => {
    const canvas = canvasRef.current;
    const game = parsedRef.current;
    if (!canvas || !game) return;
    drawChessArt(canvas, game.moves, buildPosterOptions(game, moveLimit));
  };

  const stopAnimation = () => {
    isPlayingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const scheduleNext = (moveIndex: number, speed: number) => {
    const game = parsedRef.current;
    if (!isPlayingRef.current || !game) return;

    if (moveIndex >= game.moves.length) {
      isPlayingRef.current = false;
      onPlayEndRef.current?.();
      return;
    }

    // Render all previous moves as a static base
    renderAtMove(moveIndex);

    const drawDuration = Math.min(250, Math.max(15, speed * 0.5));
    const startTime = performance.now();

    const animate = () => {
      if (!isPlayingRef.current) return;

      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / drawDuration);

      // Re-render static base each frame to keep a clean canvas
      renderAtMove(moveIndex);

      const canvas = canvasRef.current;
      const g = parsedRef.current;
      if (!canvas || !g) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { x0, y0, squareSize } = getBoardGeometry(widthRef.current, heightRef.current, true);
      const tokens = getTokens(styleRef.current);

      drawMoveAtProgress(
        ctx,
        g.moves[moveIndex],
        moveIndex,
        g.moves.length,
        x0,
        y0,
        squareSize,
        styleRef.current,
        tokens,
        progress
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Move fully drawn — notify scrubber, then schedule next
        onMoveChangeRef.current?.(moveIndex + 1);
        timeoutRef.current = setTimeout(() => {
          scheduleNext(moveIndex + 1, speed);
        }, 0);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas || !parsed || parsed.moves.length === 0) return;
    drawChessArt(canvas, parsed.moves, buildPosterOptions(parsed));
  };

  // Re-render when pgn / format / style changes (also stops any in-progress animation)
  useEffect(() => {
    stopAnimation();
    if (!parsed || parsed.moves.length === 0) return;
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgn, format, style]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let fresh: ReturnType<typeof parsePgn>;
    try {
      fresh = parsePgn(pgn);
      drawChessArt(canvas, fresh.moves, buildPosterOptions(fresh));
    } catch {
      return;
    }

    const whiteSlug = fresh.tags.White?.trim().toLowerCase().replace(/\s+/g, "-") ?? "white";
    const blackSlug = fresh.tags.Black?.trim().toLowerCase().replace(/\s+/g, "-") ?? "black";
    const year = (fresh.tags.Date ?? fresh.tags.UTCDate ?? "").slice(0, 4).replace("????", "") || null;
    const parts = ["plotted", `${whiteSlug}-vs-${blackSlug}`, year, format, style].filter(Boolean);
    const filename = `${parts.join("-")}.png`;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const play = (from: number, speed: number) => {
    stopAnimation();
    isPlayingRef.current = true;
    scheduleNext(from, speed);
  };

  const pause = () => {
    stopAnimation();
  };

  const seekTo = (n: number) => {
    stopAnimation();
    renderAtMove(n);
  };

  useImperativeHandle(ref, () => ({ downloadPng, play, pause, seekTo }), [pgn, format, style]);

  return (
    <div className="relative">
      <div className="absolute -inset-10 -z-10 rounded-[36px] bg-[radial-gradient(50%_50%_at_50%_30%,rgba(99,102,241,0.04),rgba(0,0,0,0))] blur-xl dark:bg-[radial-gradient(70%_70%_at_50%_30%,rgba(99,102,241,0.28),rgba(0,0,0,0))]" />
      <div className="relative flex items-center justify-center rounded-2xl border border-black/[0.06] bg-black/[0.03] p-3 dark:border-white/10 dark:bg-black/20 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_64px_rgba(0,0,0,0.55)]">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ width: "100%", height: "auto", maxWidth: Math.min(width, 720) }}
          className="rounded-xl"
        />
        <div
          className="pointer-events-none absolute inset-3 rounded-xl"
          style={{
            background: "radial-gradient(ellipse 88% 88% at 50% 50%, transparent 60%, rgba(0,0,0,0.18) 100%)",
          }}
        />
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {parsed ? `Rendered ${parsed.moves.length} half-moves.` : "Paste a PGN to generate artwork."}
      </p>
    </div>
  );
});
