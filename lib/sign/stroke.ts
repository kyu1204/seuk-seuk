export interface Point {
  x: number;
  y: number;
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function scaleForDpr(
  cssWidth: number,
  cssHeight: number,
  dpr: number
): { width: number; height: number } {
  return {
    width: Math.round(cssWidth * dpr),
    height: Math.round(cssHeight * dpr),
  };
}

export function pushStroke<T>(history: T[], stroke: T): T[] {
  return [...history, stroke];
}

export function popStroke<T>(history: T[]): { history: T[]; removed: T | null } {
  if (history.length === 0) return { history, removed: null };
  return { history: history.slice(0, -1), removed: history[history.length - 1] };
}
