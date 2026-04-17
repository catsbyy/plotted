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

export type ArtStyle = "neon" | "ink" | "blueprint" | "watercolor";

export type Format = "square" | "portrait" | "landscape";

export function formatDimensions(format: Format): { width: number; height: number } {
  switch (format) {
    case "portrait":  return { width: 1587, height: 2245 };
    case "landscape": return { width: 2245, height: 1587 };
    case "square":
    default:          return { width: 2048, height: 2048 };
  }
}

export type DrawOptions = {
  width: number;
  height: number;
  padding?: number;
  style?: ArtStyle; // default "neon"
  poster?: PosterMeta;
};

type RGB = { r: number; g: number; b: number };

type StyleTokens = {
  // Background
  bgBase: string;
  bgGradientInner: string;
  bgGradientOuter: string;
  // Board
  boardLight: string;
  boardDark: string;
  boardGrid: string;
  boardBorder: string;
  boardLabel: string;
  // Move lines
  compositeOperation: GlobalCompositeOperation;
  whiteBase: RGB;
  blackBase: RGB;
  shadowBlurScale: number;
  opacityRange: [number, number];
  // Time gradient
  gradientOpening: string;
  gradientMiddle: string;
  gradientEnd: string;
  // Capture marker
  captureFill: (progress: number) => string;
  captureShadow: (progress: number) => string;
  // Castle marker
  castleColour: string;
  castleShadow: string;
  // Mate marker
  mateColour: string;
  mateShadow: string;
  mateStroke: string;
  // Poster text
  titleColour: string;
  subtitleColour: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
  footerPrimaryColour: string;
  footerBodyColour: string;
  posterBorderColour: string;
  // Legend
  legendBg: string;
  legendBorder: string;
  legendTitleColour: string;
  legendText: string;
  // Line rendering
  lineWidthMultiplier: number;
  knightBendBase: number;
  boardOverlay: string;
};

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

function makeGradRgb(openingHex: string, middleHex: string, endHex: string) {
  return (progress: number): RGB => {
    const opening = hexToRgb(openingHex);
    const middle = hexToRgb(middleHex);
    const end = hexToRgb(endHex);
    const t = Math.min(1, Math.max(0, progress));
    return t < 0.5 ? lerpRgb(opening, middle, t / 0.5) : lerpRgb(middle, end, (t - 0.5) / 0.5);
  };
}

function getTokens(style: ArtStyle): StyleTokens {
  switch (style) {
    case "ink": {
      return {
        bgBase: "#f5f0e8",
        bgGradientInner: "rgba(180, 160, 120, 0.08)",
        bgGradientOuter: "rgba(0, 0, 0, 0)",
        boardLight: "rgba(0, 0, 0, 0.04)",
        boardDark: "rgba(0, 0, 0, 0.09)",
        boardGrid: "rgba(0, 0, 0, 0.10)",
        boardBorder: "rgba(0, 0, 0, 0.18)",
        boardLabel: "rgba(0, 0, 0, 0.40)",
        compositeOperation: "source-over",
        whiteBase: { r: 30, g: 60, b: 120 },
        blackBase: { r: 10, g: 10, b: 10 },
        shadowBlurScale: 0,
        opacityRange: [0.18, 0.80],
        gradientOpening: "#1e3a8a",
        gradientMiddle: "#6b21a8",
        gradientEnd: "#7f1d1d",
        captureFill: (p) => `rgba(180, 30, 30, ${(0.55 + p * 0.3).toFixed(3)})`,
        captureShadow: (p) => `rgba(180, 30, 30, ${Math.min(1, 0.55 + p * 0.3 + 0.15).toFixed(3)})`,
        castleColour: "rgba(30, 100, 60, 0.65)",
        castleShadow: "rgba(0, 0, 0, 0)",
        mateColour: "rgba(120, 20, 20, 0.85)",
        mateShadow: "rgba(0, 0, 0, 0)",
        mateStroke: "rgba(0, 0, 0, 0)",
        titleColour: "rgba(20, 20, 20, 0.92)",
        subtitleColour: "rgba(60, 50, 40, 0.65)",
        chipBg: "rgba(0, 0, 0, 0.06)",
        chipBorder: "rgba(0, 0, 0, 0.18)",
        chipText: "rgba(20, 20, 20, 0.85)",
        footerPrimaryColour: "rgba(20, 20, 20, 0.70)",
        footerBodyColour: "rgba(60, 50, 40, 0.58)",
        posterBorderColour: "rgba(0, 0, 0, 0.12)",
        legendBg: "rgba(0, 0, 0, 0.05)",
        legendBorder: "rgba(0, 0, 0, 0.12)",
        legendTitleColour: "rgba(20, 20, 20, 0.92)",
        legendText: "rgba(20, 20, 20, 0.80)",
        lineWidthMultiplier: 1.0,
        knightBendBase: 0.7,
        boardOverlay: "rgba(0, 0, 0, 0)",
      };
    }

    case "blueprint": {
      return {
        bgBase: "#0d1b2a",
        bgGradientInner: "rgba(0, 100, 180, 0.18)",
        bgGradientOuter: "rgba(0, 0, 0, 0)",
        boardLight: "rgba(100, 180, 255, 0.07)",
        boardDark: "rgba(0, 50, 120, 0.10)",
        boardGrid: "rgba(100, 200, 255, 0.14)",
        boardBorder: "rgba(100, 200, 255, 0.22)",
        boardLabel: "rgba(150, 210, 255, 0.55)",
        compositeOperation: "source-over",
        whiteBase: { r: 220, g: 240, b: 255 },
        blackBase: { r: 80, g: 180, b: 255 },
        shadowBlurScale: 0.4,
        opacityRange: [0.30, 0.90],
        gradientOpening: "#93c5fd",
        gradientMiddle: "#c4b5fd",
        gradientEnd: "#f9a8d4",
        captureFill: (p) => `rgba(255, 220, 80, ${(0.55 + p * 0.35).toFixed(3)})`,
        captureShadow: (p) => `rgba(255, 220, 80, ${Math.min(1, 0.55 + p * 0.35 + 0.15).toFixed(3)})`,
        castleColour: "rgba(100, 255, 180, 0.72)",
        castleShadow: "rgba(100, 255, 180, 0.40)",
        mateColour: "rgba(255, 240, 100, 0.85)",
        mateShadow: "rgba(255, 240, 100, 0.55)",
        mateStroke: "rgba(255, 240, 100, 0.40)",
        titleColour: "rgba(200, 230, 255, 0.95)",
        subtitleColour: "rgba(150, 200, 240, 0.70)",
        chipBg: "rgba(100, 180, 255, 0.12)",
        chipBorder: "rgba(100, 200, 255, 0.22)",
        chipText: "rgba(200, 235, 255, 0.90)",
        footerPrimaryColour: "rgba(180, 220, 255, 0.75)",
        footerBodyColour: "rgba(140, 190, 230, 0.60)",
        posterBorderColour: "rgba(100, 200, 255, 0.14)",
        legendBg: "rgba(0, 60, 120, 0.40)",
        legendBorder: "rgba(100, 200, 255, 0.18)",
        legendTitleColour: "rgba(200, 230, 255, 0.95)",
        legendText: "rgba(200, 235, 255, 0.85)",
        lineWidthMultiplier: 1.0,
        knightBendBase: 0.7,
        boardOverlay: "rgba(0, 30, 80, 0.04)",
      };
    }

    case "watercolor": {
      return {
        bgBase: "#faf8f4",
        bgGradientInner: "rgba(200, 180, 230, 0.12)",
        bgGradientOuter: "rgba(0, 0, 0, 0)",
        boardLight: "rgba(0, 0, 0, 0.025)",
        boardDark: "rgba(0, 0, 0, 0.055)",
        boardGrid: "rgba(0, 0, 0, 0.06)",
        boardBorder: "rgba(0, 0, 0, 0.10)",
        boardLabel: "rgba(80, 60, 50, 0.45)",
        compositeOperation: "multiply",
        whiteBase: { r: 100, g: 160, b: 220 },
        blackBase: { r: 200, g: 100, b: 130 },
        shadowBlurScale: 0,
        opacityRange: [0.12, 0.55],
        gradientOpening: "#bfdbfe",
        gradientMiddle: "#ddd6fe",
        gradientEnd: "#fecaca",
        captureFill: (p) => `rgba(180, 60, 60, ${(0.30 + p * 0.25).toFixed(3)})`,
        captureShadow: (p) => `rgba(180, 60, 60, ${Math.min(1, 0.30 + p * 0.25 + 0.10).toFixed(3)})`,
        castleColour: "rgba(80, 180, 120, 0.38)",
        castleShadow: "rgba(0, 0, 0, 0)",
        mateColour: "rgba(160, 40, 40, 0.55)",
        mateShadow: "rgba(0, 0, 0, 0)",
        mateStroke: "rgba(0, 0, 0, 0)",
        titleColour: "rgba(40, 30, 25, 0.88)",
        subtitleColour: "rgba(80, 65, 55, 0.62)",
        chipBg: "rgba(0, 0, 0, 0.05)",
        chipBorder: "rgba(0, 0, 0, 0.12)",
        chipText: "rgba(40, 30, 25, 0.82)",
        footerPrimaryColour: "rgba(50, 40, 35, 0.72)",
        footerBodyColour: "rgba(90, 75, 65, 0.56)",
        posterBorderColour: "rgba(0, 0, 0, 0.08)",
        legendBg: "rgba(0, 0, 0, 0.04)",
        legendBorder: "rgba(0, 0, 0, 0.10)",
        legendTitleColour: "rgba(40, 30, 25, 0.88)",
        legendText: "rgba(40, 30, 25, 0.78)",
        lineWidthMultiplier: 2.2,
        knightBendBase: 1.1,
        boardOverlay: "rgba(0, 0, 0, 0)",
      };
    }

    default: {
      // "neon" — maps exactly to all original hardcoded values
      const gRgb = makeGradRgb("#2563eb", "#7c3aed", "#ef4444");
      return {
        bgBase: "#0b0f1a",
        bgGradientInner: "rgba(99, 102, 241, 0.12)",
        bgGradientOuter: "rgba(0, 0, 0, 0)",
        boardLight: "rgba(255,255,255,0.06)",
        boardDark: "rgba(255,255,255,0.02)",
        boardGrid: "rgba(255,255,255,0.06)",
        boardBorder: "rgba(255,255,255,0.12)",
        boardLabel: "rgba(255,255,255,0.25)",
        compositeOperation: "lighter",
        whiteBase: { r: 34, g: 211, b: 238 },
        blackBase: { r: 229, g: 231, b: 235 },
        shadowBlurScale: 1.0,
        opacityRange: [0.25, 0.95],
        gradientOpening: "#2563eb",
        gradientMiddle: "#7c3aed",
        gradientEnd: "#ef4444",
        captureFill: (p) => rgbToCss(gRgb(p), 0.75),
        captureShadow: (p) => rgbToCss(gRgb(p), 0.9),
        castleColour: "rgba(34, 197, 94, 0.75)",
        castleShadow: "rgba(34, 197, 94, 0.9)",
        mateColour: "rgba(250, 204, 21, 0.78)",
        mateShadow: "rgba(250, 204, 21, 0.95)",
        mateStroke: "rgba(250, 204, 21, 0.55)",
        titleColour: "rgba(255,255,255,0.92)",
        subtitleColour: "rgba(255,255,255,0.60)",
        chipBg: "rgba(255,255,255,0.08)",
        chipBorder: "rgba(255,255,255,0.12)",
        chipText: "rgba(255,255,255,0.82)",
        footerPrimaryColour: "rgba(255,255,255,0.65)",
        footerBodyColour: "rgba(255,255,255,0.52)",
        posterBorderColour: "rgba(255,255,255,0.10)",
        legendBg: "rgba(255,255,255,0.05)",
        legendBorder: "rgba(255,255,255,0.10)",
        legendTitleColour: "rgba(255,255,255,0.78)",
        legendText: "rgba(255,255,255,0.60)",
        lineWidthMultiplier: 1.0,
        knightBendBase: 0.7,
        boardOverlay: "rgba(255,255,255,0.03)",
      };
    }
  }
}

const PLAYER_GRADIENTS: Record<ArtStyle, [string, string, string, string]> = {
  neon:       ["#2563eb", "#7c3aed", "#d97706", "#dc2626"],
  ink:        ["#1e3a8a", "#6b21a8", "#92400e", "#7f1d1d"],
  // Watercolour: same gradient both players — distinction comes from multiply layering, not hue
  watercolor: ["#bfdbfe", "#ddd6fe", "#ddd6fe", "#fecaca"],
  blueprint:  ["#e0f2fe", "#7dd3fc", "#7dd3fc", "#2563eb"],
};

function getMoveGradientRgb(progress: number, color: "w" | "b", style: ArtStyle): RGB {
  const t = Math.min(1, Math.max(0, progress));
  const [wOpen, wEnd, bOpen, bEnd] = PLAYER_GRADIENTS[style];
  const [openHex, endHex] = color === "w" ? [wOpen, wEnd] : [bOpen, bEnd];
  return lerpRgb(hexToRgb(openHex), hexToRgb(endHex), t);
}

export function getMoveGradient(progress: number, alpha: number, color: "w" | "b", style: ArtStyle) {
  return rgbToCss(getMoveGradientRgb(progress, color, style), alpha);
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

function fillBackground(ctx: CanvasRenderingContext2D, width: number, height: number, tokens: StyleTokens) {
  const minDim = Math.min(width, height);
  ctx.save();
  ctx.fillStyle = tokens.bgBase;
  ctx.fillRect(0, 0, width, height);
  const grad = ctx.createRadialGradient(
    width * 0.5, height * 0.35, minDim * 0.1,
    width * 0.5, height * 0.55, minDim * 0.9,
  );
  grad.addColorStop(0, tokens.bgGradientInner);
  grad.addColorStop(1, tokens.bgGradientOuter);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawBoard(ctx: CanvasRenderingContext2D, x0: number, y0: number, boardSize: number, tokens: StyleTokens) {
  const squareSize = boardSize / 8;

  ctx.save();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      ctx.fillStyle = (r + f) % 2 === 0 ? tokens.boardLight : tokens.boardDark;
      ctx.fillRect(x0 + f * squareSize, y0 + r * squareSize, squareSize, squareSize);
    }
  }

  ctx.strokeStyle = tokens.boardGrid;
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

  ctx.fillStyle = tokens.boardLabel;
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

  ctx.strokeStyle = tokens.boardBorder;
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

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tokens: StyleTokens, style: ArtStyle) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, Math.max(10, h * 0.18));
  ctx.fillStyle = tokens.legendBg;
  ctx.fill();
  ctx.strokeStyle = tokens.legendBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Auto-scale legend typography so all items fit without overlap.
  const padX0 = w * 0.08;
  const padY0 = h * 0.12;
  const titleSize0 = Math.max(11, Math.round(h * 0.18));
  const barH0 = Math.max(8, Math.round(h * 0.096)); // ~80% of previous 0.12
  const labelSize0 = Math.max(9, Math.round(h * 0.13));
  const itemH0 = Math.max(13, Math.round(h * 0.128));
  const gapTitle0 = h * 0.06;
  const gapBar0 = h * 0.04;
  const barGap0 = barH0 * 1.8;
  const gapAfterLine0 = h * 0.10;

  const required =
    padY0 * 2 +
    titleSize0 +
    gapTitle0 +
    labelSize0 +
    gapBar0 +
    barH0 +
    barGap0 +
    barH0 +
    gapAfterLine0 +
    itemH0 * 3;
  const scale = Math.min(1, h / Math.max(1, required));

  const padX = padX0;
  const padY = padY0 * scale;
  const titleSize = Math.max(10, Math.floor(titleSize0 * scale));
  const barH = Math.max(7, Math.floor(barH0 * scale));
  const labelSize = Math.max(8, Math.floor(labelSize0 * scale));
  const itemH = Math.max(12, Math.floor(itemH0 * scale));
  const gapTitle = gapTitle0 * scale;
  const gapBar = gapBar0 * scale;
  const barGap = barH * 1.8;
  const gapAfterLine = gapAfterLine0 * scale;

  const x0 = x + padX;
  let y0 = y + padY;

  // Title
  ctx.fillStyle = tokens.legendTitleColour;
  ctx.textBaseline = "top";
  ctx.font = `600 ${titleSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText("Legend", x0, y0);
  y0 += titleSize + gapTitle;

  // Shared label above both gradient bars
  ctx.fillStyle = tokens.legendText;
  ctx.font = `${labelSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textBaseline = "top";
  ctx.fillText("Opening → Endgame", x0, y0);
  y0 += labelSize + gapBar;

  // Per-player gradient colours
  const [wOpen, wEnd, bOpen, bEnd] = PLAYER_GRADIENTS[style];

  // Measure "White"/"Black" label width to align the bar
  ctx.font = `${labelSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const sideW = Math.max(ctx.measureText("White").width, ctx.measureText("Black").width) + w * 0.04;
  const gradBarX = x0 + sideW;
  const gradBarW = w - padX * 2 - sideW;

  // White player bar
  const whiteGrad = ctx.createLinearGradient(gradBarX, 0, gradBarX + gradBarW, 0);
  whiteGrad.addColorStop(0, wOpen);
  whiteGrad.addColorStop(1, wEnd);
  roundedRectPath(ctx, gradBarX, y0, gradBarW, barH, barH / 2);
  ctx.fillStyle = whiteGrad;
  ctx.fill();
  ctx.strokeStyle = tokens.boardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = tokens.legendText;
  ctx.textBaseline = "middle";
  ctx.fillText("White", x0, y0 + barH / 2);
  y0 += barH + barGap;

  // Black player bar
  const blackGrad = ctx.createLinearGradient(gradBarX, 0, gradBarX + gradBarW, 0);
  blackGrad.addColorStop(0, bOpen);
  blackGrad.addColorStop(1, bEnd);
  roundedRectPath(ctx, gradBarX, y0, gradBarW, barH, barH / 2);
  ctx.fillStyle = blackGrad;
  ctx.fill();
  ctx.strokeStyle = tokens.boardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = tokens.legendText;
  ctx.textBaseline = "middle";
  ctx.fillText("Black", x0, y0 + barH / 2);
  y0 += barH + gapAfterLine;

  // Items: Capture, Castling, Checkmate only
  const iconS = Math.max(10, Math.round(itemH * 0.7));
  const iconX = x0;
  const textX = x0 + iconS + w * 0.06;

  const drawItem = (yy: number, drawIcon: () => void, text: string) => {
    ctx.save();
    drawIcon();
    ctx.fillStyle = tokens.legendText;
    ctx.textBaseline = "middle";
    ctx.font = `${labelSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.fillText(text, textX, yy + itemH / 2);
    ctx.restore();
  };

  drawItem(y0, () => {
    ctx.shadowBlur = Math.max(10, h * 0.16);
    ctx.shadowColor = tokens.captureShadow(0.85);
    ctx.fillStyle = tokens.captureFill(0.85);
    ctx.beginPath();
    ctx.arc(iconX + iconS * 0.5, y0 + itemH * 0.5, iconS * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, "Capture");
  y0 += itemH;

  drawItem(y0, () => {
    ctx.shadowBlur = Math.max(10, h * 0.16);
    ctx.shadowColor = tokens.castleShadow;
    ctx.fillStyle = tokens.castleColour;
    roundedRectPath(ctx, iconX + iconS * 0.15, y0 + itemH * 0.2, iconS * 0.7, iconS * 0.7, iconS * 0.28);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, "Castling");
  y0 += itemH;

  drawItem(y0, () => {
    const cx = iconX + iconS * 0.5;
    const cy = y0 + itemH * 0.5;
    const r1 = iconS * 0.45;
    const r2 = iconS * 0.20;
    ctx.shadowBlur = Math.max(10, h * 0.16);
    ctx.shadowColor = tokens.mateShadow;
    ctx.fillStyle = tokens.mateColour;
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
  width: number,
  height: number,
  meta: PosterMeta,
  margin: number,
  headerH: number,
  footerH: number,
  footerMaxW: number,
  tokens: StyleTokens,
) {
  const base = Math.min(width, height);
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
  const maxTitleW = width - margin * 2;
  const defaultTitleSize = Math.max(18, Math.round(base * 0.030));
  const minTitleSize = Math.max(14, Math.round(base * 0.018));

  let titleFontSize = defaultTitleSize;
  ctx.font = `600 ${titleFontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  while (ctx.measureText(title).width > maxTitleW && titleFontSize > minTitleSize) {
    titleFontSize -= 1;
    ctx.font = `600 ${titleFontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  }

  let displayTitle = title;
  if (ctx.measureText(displayTitle).width > maxTitleW) {
    while (ctx.measureText(displayTitle + "…").width > maxTitleW && displayTitle.length > 0) {
      displayTitle = displayTitle.slice(0, -1);
    }
    displayTitle = displayTitle.trimEnd() + "…";
  }

  ctx.fillStyle = tokens.titleColour;
  ctx.textBaseline = "top";
  ctx.fillText(displayTitle, leftX, topY);

  ctx.fillStyle = tokens.subtitleColour;
  ctx.font = `${Math.max(12, Math.round(base * 0.016))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const subLine = [subtitle, date].filter(Boolean).join(" • ");
  if (subLine) ctx.fillText(subLine, leftX, topY + base * 0.038);

  const playersY = topY + headerH * 0.54;
  const chipH = Math.max(22, Math.round(headerH * 0.22));
  const chipPadX = Math.round(chipH * 0.45);
  const chipGap = Math.round(chipH * 0.32);

  const whiteLabel = `White: ${white}`;
  const blackLabel = `Black: ${black}`;
  ctx.font = `600 ${Math.max(12, Math.round(chipH * 0.45))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;

  const chipY = playersY;
  const drawChip = (x: number, label: string) => {
    ctx.save();
    const w = ctx.measureText(label).width + chipPadX * 2;
    roundedRectPath(ctx, x, chipY, w, chipH, chipH / 2);
    ctx.fillStyle = tokens.chipBg;
    ctx.fill();
    ctx.strokeStyle = tokens.chipBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = tokens.chipText;
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + chipPadX, chipY + chipH / 2);
    ctx.restore();
    return w;
  };

  const w1 = drawChip(leftX, whiteLabel);
  drawChip(leftX + w1 + chipGap, blackLabel);

  const footerY = height - margin - footerH + Math.round(footerH * 0.14);
  ctx.fillStyle = tokens.footerPrimaryColour;
  ctx.textBaseline = "top";
  ctx.font = `600 ${Math.max(12, Math.round(base * 0.016))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const footerLine = termination ? termination : result || "";
  if (footerLine) ctx.fillText(footerLine, margin, footerY);

  ctx.fillStyle = tokens.footerBodyColour;
  ctx.font = `${Math.max(10, Math.round(base * 0.0125))}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  if (movesText) {
    const maxW = footerMaxW;
    const words = movesText.split(/\s+/).filter(Boolean);
    let line = "";
    let lineY = footerY + Math.round(footerH * 0.28);
    const lineH = Math.round(base * 0.016);
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxW && line) {
        ctx.fillText(line, margin, lineY);
        line = word;
        lineY += lineH;
        if (lineY > height - margin - lineH) break;
      } else {
        line = next;
      }
    }
    if (line && lineY <= height - margin - lineH) ctx.fillText(line, margin, lineY);
  }

  ctx.restore();
}

export function drawChessArt(canvas: HTMLCanvasElement, moves: Move[], options: DrawOptions) {
  const width  = Math.max(256, Math.floor(options.width));
  const height = Math.max(256, Math.floor(options.height));
  const minDim = Math.min(width, height);
  const meta = options.poster;
  const margin = options.padding ?? Math.round(minDim * 0.06);
  const headerH = meta ? Math.round(minDim * 0.16) : 0;
  // Give the poster footer extra height to fit the full movetext.
  const footerH = meta ? Math.round(minDim * 0.23) : 0;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width  = width;
  canvas.height = height;

  const style = options.style ?? "neon";
  const tokens = getTokens(style);

  fillBackground(ctx, width, height, tokens);

  const availableH = height - margin * 2 - headerH - footerH;
  const availableW = width  - margin * 2;
  const boardSize = Math.floor(Math.min(availableW, availableH));
  const x0 = Math.floor((width  - boardSize) / 2);
  const y0 = margin + headerH + Math.floor((availableH - boardSize) / 2);
  const { squareSize } = drawBoard(ctx, x0, y0, boardSize, tokens);

  if (meta) {
    const footerY = height - margin - footerH;
    const legendW = Math.round(minDim * 0.30);
    const gap = Math.round(minDim * 0.02);
    const legendH = Math.round(footerH * 0.78);
    const legendX = width - margin - legendW;
    const legendY = footerY + Math.round((footerH - legendH) / 2);

    const footerMaxW = width - margin * 2 - legendW - gap;
    drawPosterText(ctx, width, height, meta, margin, headerH, footerH, footerMaxW, tokens);
    drawLegend(ctx, legendX, legendY, legendW, legendH, tokens, style);
  }

  const total = moves.length;
  ctx.save();
  ctx.globalCompositeOperation = tokens.compositeOperation;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const progress = total <= 1 ? 1 : i / (total - 1);
    const [minOp, maxOp] = tokens.opacityRange;
    const opacity = minOp + progress * (maxOp - minOp);

    const start = squareToCenter(m.from, x0, y0, squareSize);
    const end = squareToCenter(m.to, x0, y0, squareSize);

    ctx.lineWidth = pieceWidth(m.piece, squareSize) * tokens.lineWidthMultiplier;

    let gradRgb: RGB;
    if (style === "watercolor") {
      // Original approach: single 3-stop gradient tinted by player base colour.
      // Multiply blend makes separate warm/cool gradients muddy; the whiteBase/blackBase
      // tint at 30% gives warm/cool distinction without hue clashes.
      const colorBase = m.color === "w" ? tokens.whiteBase : tokens.blackBase;
      const wcGrad = makeGradRgb("#bfdbfe", "#ddd6fe", "#fecaca")(progress);
      gradRgb = lerpRgb(wcGrad, colorBase, 0.30);
    } else {
      gradRgb = getMoveGradientRgb(progress, m.color, style);
    }
    const stroke = rgbToCss(gradRgb, opacity);
    const glow = rgbToCss(gradRgb, Math.min(1, opacity * 0.85));

    ctx.shadowColor = glow;
    const blurBase = Math.max(6, squareSize * 0.15);
    ctx.shadowBlur = tokens.shadowBlurScale === 0 ? 0 : blurBase * tokens.shadowBlurScale;
    ctx.strokeStyle = stroke;

    if (m.piece === "Knight") {
      const boardCentreX = x0 + boardSize / 2;
      const boardCentreY = y0 + boardSize / 2;
      const moveMidX = (start.x + end.x) / 2;
      const moveMidY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len;
      const ny = dx / len;
      const cx = moveMidX - boardCentreX;
      const cy = moveMidY - boardCentreY;
      const dot = nx * cx + ny * cy;
      const direction = dot >= 0 ? 1 : -1;
      const bend = squareSize * (tokens.knightBendBase + (i % 3) * 0.18) * direction;
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
      ctx.shadowColor = getMoveGradient(progress, 0.9, m.color, style);
      ctx.fillStyle = getMoveGradient(progress, 0.75, m.color, style);
      ctx.beginPath();
      ctx.arc(end.x, end.y, squareSize * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (m.castle) {
      ctx.save();
      ctx.shadowBlur = Math.max(10, squareSize * 0.22);
      ctx.shadowColor = tokens.castleShadow;
      ctx.fillStyle = tokens.castleColour;
      const s = squareSize * 0.16;
      roundedRectPath(ctx, end.x - s, end.y - s, s * 2, s * 2, s * 0.55);
      ctx.fill();
      ctx.restore();
    }

    if (m.mate) {
      ctx.save();
      ctx.shadowBlur = Math.max(14, squareSize * 0.28);
      ctx.shadowColor = tokens.mateShadow;
      ctx.fillStyle = tokens.mateColour;

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

      ctx.strokeStyle = getMoveGradient(progress, 0.55, m.color, style);
      ctx.lineWidth = Math.max(1, squareSize * 0.02);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = tokens.boardOverlay;
  ctx.fillRect(x0, y0, boardSize, boardSize);
  ctx.restore();

  if (meta) {
    ctx.save();
    ctx.strokeStyle = tokens.posterBorderColour;
    ctx.lineWidth = Math.max(2, Math.round(minDim * 0.003));
    roundedRectPath(ctx, margin * 0.35, margin * 0.35, width - margin * 0.7, height - margin * 0.7, Math.round(minDim * 0.03));
    ctx.stroke();
    ctx.restore();
  }
}
