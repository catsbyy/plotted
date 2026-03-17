import { Chess } from "chess.js";

export type PieceType = "Pawn" | "Knight" | "Bishop" | "Rook" | "Queen" | "King";
export type PgnTags = Record<string, string>;

export type Move = {
  moveIndex: number; // 1..N (half-moves)
  color: "w" | "b";
  piece: PieceType;
  from: string;
  to: string;
  capture: boolean;
  check: boolean;
  mate: boolean;
  castle: boolean;
  san: string;
};

export type ParsedGame = {
  tags: PgnTags;
  moves: Move[];
};

function pieceFromLetter(letter: string): PieceType {
  switch (letter) {
    case "p":
      return "Pawn";
    case "n":
      return "Knight";
    case "b":
      return "Bishop";
    case "r":
      return "Rook";
    case "q":
      return "Queen";
    case "k":
      return "King";
    default:
      return "Pawn";
  }
}

export function parsePgnTags(pgn: string): PgnTags {
  const tags: PgnTags = {};
  for (const rawLine of pgn.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("[")) continue;
    const m = line.match(/^\[([A-Za-z0-9_]+)\s+"(.*)"\]$/);
    if (!m) continue;
    tags[m[1]] = m[2];
  }
  return tags;
}

export function parsePgn(pgn: string): ParsedGame {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn, { strict: false });
  } catch {
    throw new Error("Invalid PGN. Make sure it includes legal moves.");
  }

  const history = chess.history({ verbose: true });
  if (history.length === 0) throw new Error("No moves found in PGN.");

  const moves: Move[] = history.map((m, i) => {
    const flags = m.flags ?? "";
    const capture = flags.includes("c") || flags.includes("e");
    const castle = flags.includes("k") || flags.includes("q");
    const san = m.san ?? "";
    const check = san.includes("+") || san.includes("#");
    const mate = san.includes("#");
    return {
      moveIndex: i + 1,
      color: m.color,
      piece: pieceFromLetter(m.piece),
      from: m.from,
      to: m.to,
      capture,
      check,
      mate,
      castle,
      san,
    };
  });

  return { tags: parsePgnTags(pgn), moves };
}

export type PosterMeta = {
  title?: string;
  subtitle?: string;
  white?: string;
  black?: string;
  result?: string;
  date?: string;
  termination?: string;
  movesText?: string;
};

export type DrawOptions = {
  size: number;
  padding?: number;
  poster?: PosterMeta;
};

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) };
}

function rgbToCss(rgb: RGB, alpha: number) {
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
}

function getMoveGradientRgb(progress: number): RGB {
  const opening = hexToRgb("#2563eb"); // blue-600
  const middle = hexToRgb("#7c3aed"); // violet-600
  const end = hexToRgb("#ef4444"); // red-500
  const t = Math.min(1, Math.max(0, progress));
  return t < 0.5 ? lerpRgb(opening, middle, t / 0.5) : lerpRgb(middle, end, (t - 0.5) / 0.5);
}

export function getMoveGradient(progress: number, alpha: number) {
  return rgbToCss(getMoveGradientRgb(progress), alpha);
}

export function squareToCenter(square: string, boardX: number, boardY: number, squareSize: number) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]) - 1;
  return {
    x: boardX + file * squareSize + squareSize / 2,
    y: boardY + (7 - rank) * squareSize + squareSize / 2,
  };
}

function pieceWidth(piece: PieceType, squareSize: number) {
  switch (piece) {
    case "Pawn":
      return squareSize * 0.08;
    case "Knight":
      return squareSize * 0.13;
    case "Bishop":
      return squareSize * 0.12;
    case "Rook":
      return squareSize * 0.18;
    case "Queen":
      return squareSize * 0.22;
    case "King":
      return squareSize * 0.1;
  }
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fillBackground(ctx: CanvasRenderingContext2D, size: number) {
  ctx.save();
  ctx.fillStyle = "#0b0f1a";
  ctx.fillRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.35, size * 0.1, size * 0.5, size * 0.55, size * 0.9);
  grad.addColorStop(0, "rgba(99, 102, 241, 0.12)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

function drawBoard(ctx: CanvasRenderingContext2D, x0: number, y0: number, boardSize: number) {
  const squareSize = boardSize / 8;
  const light = "rgba(255,255,255,0.06)";
  const dark = "rgba(255,255,255,0.02)";

  ctx.save();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      ctx.fillStyle = (r + f) % 2 === 0 ? light : dark;
      ctx.fillRect(x0 + f * squareSize, y0 + r * squareSize, squareSize, squareSize);
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const p = x0 + i * squareSize;
    ctx.beginPath();
    ctx.moveTo(p, y0);
    ctx.lineTo(p, y0 + boardSize);
    ctx.stroke();

    const q = y0 + i * squareSize;
    ctx.beginPath();
    ctx.moveTo(x0, q);
    ctx.lineTo(x0 + boardSize, q);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = `${Math.max(10, Math.round(squareSize * 0.18))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textBaseline = "top";
  for (let f = 0; f < 8; f++) {
    const file = String.fromCharCode("a".charCodeAt(0) + f);
    ctx.fillText(file, x0 + f * squareSize + squareSize * 0.08, y0 + boardSize + squareSize * 0.08);
  }
  ctx.textBaseline = "middle";
  for (let r = 0; r < 8; r++) {
    const rank = String(8 - r);
    ctx.fillText(rank, x0 - squareSize * 0.18, y0 + r * squareSize + squareSize * 0.5);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x0 - 1, y0 - 1, boardSize + 2, boardSize + 2);
  ctx.restore();

  return { squareSize };
}

function drawKnightArc(
  ctx: CanvasRenderingContext2D,
  start: { x: number; y: number },
  end: { x: number; y: number },
  bend: number,
) {
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bend;
  const cy = my + ny * bend;

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(cx, cy, end.x, end.y);
  ctx.stroke();
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, Math.max(10, h * 0.18));
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Auto-scale legend typography so all items fit without overlap.
  const padX0 = w * 0.08;
  const padY0 = h * 0.12;
  const titleSize0 = Math.max(11, Math.round(h * 0.18));
  const barH0 = Math.max(10, Math.round(h * 0.12));
  const labelSize0 = Math.max(9, Math.round(h * 0.13)); // slightly smaller than before
  const itemH0 = Math.max(13, Math.round(h * 0.128));
  const gapTitle0 = h * 0.06;
  const gapBar0 = h * 0.06;
  const gapAfterLine0 = h * 0.10;

  const required =
    padY0 * 2 +
    titleSize0 +
    gapTitle0 +
    barH0 +
    gapBar0 +
    labelSize0 +
    gapAfterLine0 +
    itemH0 * 5;
  const scale = Math.min(1, h / Math.max(1, required));

  const padX = padX0;
  const padY = padY0 * scale;
  const titleSize = Math.max(10, Math.floor(titleSize0 * scale));
  const barH = Math.max(9, Math.floor(barH0 * scale));
  const labelSize = Math.max(8, Math.floor(labelSize0 * scale));
  const itemH = Math.max(12, Math.floor(itemH0 * scale));
  const gapTitle = gapTitle0 * scale;
  const gapBar = gapBar0 * scale;
  const gapAfterLine = gapAfterLine0 * scale;

  const x0 = x + padX;
  let y0 = y + padY;

  // Title
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.textBaseline = "top";
  ctx.font = `600 ${titleSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText("Legend", x0, y0);
  y0 += titleSize + gapTitle;

  // Gradient bar (time progression)
  const barW = w - padX * 2;
  const g = ctx.createLinearGradient(x0, 0, x0 + barW, 0);
  g.addColorStop(0, getMoveGradient(0, 1));
  g.addColorStop(0.5, getMoveGradient(0.5, 1));
  g.addColorStop(1, getMoveGradient(1, 1));
  roundedRectPath(ctx, x0, y0, barW, barH, barH / 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  y0 += barH + gapBar;

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `${labelSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText("Opening → Endgame", x0, y0);
  y0 += labelSize + gapAfterLine;

  // Items (strict line-height to avoid overlap)
  const iconS = Math.max(10, Math.round(itemH * 0.7));
  const iconX = x0;
  const textX = x0 + iconS + w * 0.06;

  const drawItem = (yy: number, drawIcon: () => void, text: string) => {
    ctx.save();
    drawIcon();
    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.textBaseline = "middle";
    ctx.font = `${labelSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.fillText(text, textX, yy + itemH / 2);
    ctx.restore();
  };

  drawItem(y0, () => {
    ctx.shadowBlur = Math.max(8, h * 0.14);
    ctx.shadowColor = "rgba(34, 211, 238, 0.6)";
    ctx.strokeStyle = "rgba(34, 211, 238, 0.7)";
    ctx.lineWidth = Math.max(2, iconS * 0.22);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(iconX, y0 + itemH * 0.7);
    ctx.lineTo(iconX + iconS, y0 + itemH * 0.25);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, "White moves");
  y0 += itemH;

  drawItem(y0, () => {
    ctx.shadowBlur = Math.max(8, h * 0.14);
    ctx.shadowColor = "rgba(229, 231, 235, 0.5)";
    ctx.strokeStyle = "rgba(229, 231, 235, 0.55)";
    ctx.lineWidth = Math.max(2, iconS * 0.22);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(iconX, y0 + itemH * 0.7);
    ctx.lineTo(iconX + iconS, y0 + itemH * 0.25);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, "Black moves");
  y0 += itemH;

  drawItem(y0, () => {
    ctx.shadowBlur = Math.max(10, h * 0.16);
    ctx.shadowColor = getMoveGradient(0.85, 0.9);
    ctx.fillStyle = getMoveGradient(0.85, 0.75);
    ctx.beginPath();
    ctx.arc(iconX + iconS * 0.5, y0 + itemH * 0.5, iconS * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, "Capture");
  y0 += itemH;

  drawItem(y0, () => {
    ctx.shadowBlur = Math.max(10, h * 0.16);
    ctx.shadowColor = "rgba(34, 197, 94, 0.9)";
    ctx.fillStyle = "rgba(34, 197, 94, 0.75)";
    roundedRectPath(ctx, iconX + iconS * 0.15, y0 + itemH * 0.2, iconS * 0.7, iconS * 0.7, iconS * 0.28);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, "Castling");
  y0 += itemH;

  // Checkmate
  drawItem(y0, () => {
    const cx = iconX + iconS * 0.5;
    const cy = y0 + itemH * 0.5;
    const r1 = iconS * 0.45;
    const r2 = iconS * 0.20;
    ctx.shadowBlur = Math.max(10, h * 0.16);
    ctx.shadowColor = "rgba(250, 204, 21, 0.90)";
    ctx.fillStyle = "rgba(250, 204, 21, 0.78)";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const rr = i % 2 === 0 ? r1 : r2;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }, "Checkmate");

  ctx.restore();
}

function drawPosterText(
  ctx: CanvasRenderingContext2D,
  size: number,
  meta: PosterMeta,
  margin: number,
  headerH: number,
  footerH: number,
  footerMaxW: number,
) {
  ctx.save();
  const title = meta.title ?? "Chess Artwork";
  const subtitle = meta.subtitle ?? "";
  const white = meta.white ?? "White";
  const black = meta.black ?? "Black";
  const result = meta.result ?? "*";
  const date = meta.date ?? "";
  const termination = meta.termination ?? "";
  const movesText = meta.movesText ?? "";

  const leftX = margin;
  const topY = margin;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textBaseline = "top";
  ctx.font = `600 ${Math.max(18, Math.round(size * 0.030))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText(title, leftX, topY);

  ctx.fillStyle = "rgba(255,255,255,0.60)";
  ctx.font = `${Math.max(12, Math.round(size * 0.016))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const subLine = [subtitle, date].filter(Boolean).join(" • ");
  if (subLine) ctx.fillText(subLine, leftX, topY + size * 0.038);

  const playersY = topY + headerH * 0.54;
  const chipH = Math.max(22, Math.round(headerH * 0.22));
  const chipPadX = Math.round(chipH * 0.45);
  const chipGap = Math.round(chipH * 0.32);

  const whiteLabel = `White: ${white}`;
  const blackLabel = `Black: ${black}`;
  ctx.font = `600 ${Math.max(12, Math.round(chipH * 0.45))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;

  const chipY = playersY;
  const drawChip = (x: number, label: string, tint: "base" | "result") => {
    ctx.save();
    const w = ctx.measureText(label).width + chipPadX * 2;
    roundedRectPath(ctx, x, chipY, w, chipH, chipH / 2);
    ctx.fillStyle = tint === "result" ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + chipPadX, chipY + chipH / 2);
    ctx.restore();
    return w;
  };

  const w1 = drawChip(leftX, whiteLabel, "base");
  drawChip(leftX + w1 + chipGap, blackLabel, "base");

  const footerY = size - margin - footerH + Math.round(footerH * 0.14);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.textBaseline = "top";
  ctx.font = `600 ${Math.max(12, Math.round(size * 0.016))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const footerLine = [termination, result && result !== "*" ? `Result: ${result}` : ""].filter(Boolean).join(" • ");
  if (footerLine) ctx.fillText(footerLine, margin, footerY);

  ctx.fillStyle = "rgba(255,255,255,0.52)";
  ctx.font = `${Math.max(10, Math.round(size * 0.0125))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  if (movesText) {
    const maxW = footerMaxW;
    const words = movesText.split(/\s+/).filter(Boolean);
    let line = "";
    let lineY = footerY + Math.round(footerH * 0.28);
    const lineH = Math.round(size * 0.016);
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxW && line) {
        ctx.fillText(line, margin, lineY);
        line = word;
        lineY += lineH;
        if (lineY > size - margin - lineH) break;
      } else {
        line = next;
      }
    }
    if (line && lineY <= size - margin - lineH) ctx.fillText(line, margin, lineY);
  }

  ctx.restore();
}

export function drawChessArt(canvas: HTMLCanvasElement, moves: Move[], options: DrawOptions) {
  const size = Math.max(256, Math.floor(options.size));
  const meta = options.poster;
  const margin = options.padding ?? Math.round(size * 0.06);
  const headerH = meta ? Math.round(size * 0.16) : 0;
  // Give the poster footer extra height to fit the full movetext.
  const footerH = meta ? Math.round(size * 0.23) : 0;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  fillBackground(ctx, size);

  const availableH = size - margin * 2 - headerH - footerH;
  const boardSize = Math.floor(Math.min(size - margin * 2, availableH));
  const x0 = Math.floor((size - boardSize) / 2);
  const y0 = margin + headerH + Math.floor((availableH - boardSize) / 2);
  const { squareSize } = drawBoard(ctx, x0, y0, boardSize);

  if (meta) {
    const footerY = size - margin - footerH;
    const legendW = Math.round(size * 0.30);
    const gap = Math.round(size * 0.02);
    const legendH = Math.round(footerH * 0.78);
    const legendX = size - margin - legendW;
    const legendY = footerY + Math.round((footerH - legendH) / 2);

    const footerMaxW = size - margin * 2 - legendW - gap;
    drawPosterText(ctx, size, meta, margin, headerH, footerH, footerMaxW);
    drawLegend(ctx, legendX, legendY, legendW, legendH);
  }

  const total = moves.length;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const progress = total <= 1 ? 1 : i / (total - 1);
    const opacity = 0.25 + progress * 0.7;

    const start = squareToCenter(m.from, x0, y0, squareSize);
    const end = squareToCenter(m.to, x0, y0, squareSize);

    ctx.lineWidth = pieceWidth(m.piece, squareSize);

    // White/Black differentiation while preserving time progression:
    // we tint the time-gradient towards a side-specific base.
    const base = m.color === "w" ? hexToRgb("#22d3ee") : hexToRgb("#e5e7eb"); // cyan-400 / zinc-200
    const mixed = lerpRgb(getMoveGradientRgb(progress), base, 0.30);
    const stroke = rgbToCss(mixed, opacity);
    const glow = rgbToCss(mixed, Math.min(1, opacity * 0.85));

    ctx.shadowColor = glow;
    ctx.shadowBlur = Math.max(6, squareSize * 0.15);
    ctx.strokeStyle = stroke;

    if (m.piece === "Knight") {
      const bend = squareSize * (0.7 + (i % 3) * 0.18) * (i % 2 === 0 ? 1 : -1);
      drawKnightArc(ctx, start, end, bend);
    } else {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    if (m.capture) {
      ctx.save();
      ctx.shadowBlur = Math.max(10, squareSize * 0.25);
      ctx.shadowColor = getMoveGradient(progress, 0.9);
      ctx.fillStyle = getMoveGradient(progress, 0.75);
      ctx.beginPath();
      ctx.arc(end.x, end.y, squareSize * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (m.castle) {
      ctx.save();
      ctx.shadowBlur = Math.max(10, squareSize * 0.22);
      ctx.shadowColor = "rgba(34, 197, 94, 0.9)";
      ctx.fillStyle = "rgba(34, 197, 94, 0.75)";
      const s = squareSize * 0.16;
      roundedRectPath(ctx, end.x - s, end.y - s, s * 2, s * 2, s * 0.55);
      ctx.fill();
      ctx.restore();
    }

    if (m.mate) {
      ctx.save();
      ctx.shadowBlur = Math.max(14, squareSize * 0.28);
      ctx.shadowColor = "rgba(250, 204, 21, 0.95)";
      ctx.fillStyle = "rgba(250, 204, 21, 0.78)";

      const cx = end.x;
      const cy = end.y;
      const r1 = squareSize * 0.22;
      const r2 = squareSize * 0.10;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const a = (Math.PI * 2 * k) / 12 - Math.PI / 2;
        const rr = k % 2 === 0 ? r1 : r2;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(250, 204, 21, 0.55)";
      ctx.lineWidth = Math.max(1, squareSize * 0.02);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(x0, y0, boardSize, boardSize);
  ctx.restore();

  if (meta) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = Math.max(2, Math.round(size * 0.003));
    roundedRectPath(ctx, margin * 0.35, margin * 0.35, size - margin * 0.7, size - margin * 0.7, Math.round(size * 0.03));
    ctx.stroke();
    ctx.restore();
  }
}

