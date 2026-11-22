import { FONT_STACK } from '../../utils/font';

/** Big outlined headline text, easy to read from the sofa. */
export function drawBanner(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 78,
  fill = '#ffffff',
  outline = 'rgba(70,20,120,0.85)',
): void {
  ctx.save();
  ctx.font = `900 ${size}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(8, size * 0.15);
  ctx.strokeStyle = outline;
  ctx.fillStyle = fill;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}
