"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { drawChessArt, parsePgn, type ArtStyle, type ParsedGame } from "@/lib/chessArt";

export type ChessArtCanvasHandle = {
  downloadPng: () => void;
};

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

function buildLastMoves(game: ParsedGame, halfMoves: number) {
  const total = game.moves.length;
  const start = Math.max(0, total - halfMoves);
  const slice = game.moves.slice(start);
  const out: string[] = [];
  for (let i = 0; i < slice.length; i++) {
    const globalIndex = start + i;
    const moveNumber = Math.floor(globalIndex / 2) + 1;
    const isWhite = globalIndex % 2 === 0;
    if (isWhite) out.push(`${moveNumber}.`);
    out.push(slice[i].san);
  }
  return out.join(" ");
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

export const ChessArtCanvas = forwardRef<ChessArtCanvasHandle, { pgn: string; size: number; style: ArtStyle }>(function ChessArtCanvas(
  { pgn, size, style },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const parsed = useMemo(() => {
    try {
      return parsePgn(pgn);
    } catch {
      return null;
    }
  }, [pgn]);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!parsed || parsed.moves.length === 0) return;

    const tags = parsed.tags;
    const white = tags.White?.trim() || "White";
    const black = tags.Black?.trim() || "Black";
    const result = tags.Result?.trim() || "*";
    const termination = tags.Termination?.trim() || "";
    const date = formatDateForPoster(tags.Date || tags.UTCDate || "");
    const openingName = deriveOpeningName(parsed);
    const subtitle = [openingName || tags.ECO?.trim(), tags.TimeControl?.trim() ? `${tags.TimeControl}s` : ""]
      .filter(Boolean)
      .join(" • ");

    drawChessArt(canvas, parsed.moves, {
      size,
      style,
      poster: {
        title: deriveTitle(parsed),
        subtitle,
        white,
        black,
        result,
        date,
        termination,
        movesText: buildAllMoves(parsed),
      },
    });
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Render a fresh frame at the requested resolution, then export via Blob
    // to avoid flaky behavior with large data URLs.
    let fresh: ReturnType<typeof parsePgn>;
    try {
      fresh = parsePgn(pgn);
      drawChessArt(canvas, fresh.moves, {
        size,
        style,
        poster: {
          title: deriveTitle(fresh),
          subtitle: [
            deriveOpeningName(fresh) || fresh.tags.ECO?.trim(),
            fresh.tags.TimeControl?.trim() ? `${fresh.tags.TimeControl}s` : "",
          ]
            .filter(Boolean)
            .join(" • "),
          white: fresh.tags.White?.trim() || "White",
          black: fresh.tags.Black?.trim() || "Black",
          result: fresh.tags.Result?.trim() || "*",
          date: formatDateForPoster(fresh.tags.Date || fresh.tags.UTCDate || ""),
          termination: fresh.tags.Termination?.trim() || "",
          movesText: buildAllMoves(fresh),
        },
      });
    } catch {
      // If parsing fails, do nothing.
      return;
    }

    const whiteSlug = fresh.tags.White?.trim().toLowerCase().replace(/\s+/g, "-") ?? "white";
    const blackSlug = fresh.tags.Black?.trim().toLowerCase().replace(/\s+/g, "-") ?? "black";
    const year = (fresh.tags.Date ?? fresh.tags.UTCDate ?? "").slice(0, 4).replace("????", "") || null;
    const parts = ["plotted", `${whiteSlug}-vs-${blackSlug}`, year, style].filter(Boolean);
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

  useImperativeHandle(ref, () => ({ downloadPng }), [pgn, size, style]);

  useEffect(() => {
    if (!parsed || parsed.moves.length === 0) return;
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgn, size, style]);

  return (
    <div className="relative">
      <div className="absolute -inset-10 -z-10 rounded-[36px] bg-[radial-gradient(70%_70%_at_50%_30%,rgba(99,102,241,0.28),rgba(0,0,0,0))] blur-xl" />
      <div className="relative flex items-center justify-center rounded-2xl bg-black/20 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_64px_rgba(0,0,0,0.55)]">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ width: "100%", height: "auto", maxWidth: 720 }}
          className="rounded-xl"
        />
        {/* Soft vignette to dissolve canvas edges into the background */}
        <div
          className="pointer-events-none absolute inset-3 rounded-xl"
          style={{
            background:
              "radial-gradient(ellipse 88% 88% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {parsed ? `Rendered ${parsed.moves.length} half-moves.` : "Paste a PGN to generate artwork."}
      </p>
    </div>
  );
});
