import type { Page } from '@playwright/test';

// ── Palette & counters ────────────────────────────────────────────────────────

const PALETTE = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#e67e22', // dark orange
  '#2c3e50', // dark navy
];

let _counter = 0;
const _labelGens: Array<{ reset(): void }> = [];

function nextIndex() { return _counter++; }

function contrastColor(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return '#ffffff';
  const [r, g, b] = [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? '#000000' : '#ffffff';
}

// ── Active tag registry ───────────────────────────────────────────────────────

interface ActiveEntry { handle: PageTagHandle; cleanup: () => void; }
const _active = new WeakMap<Page, ActiveEntry>();

// ── Types ─────────────────────────────────────────────────────────────────────

export type BarPlacement  = 'top' | 'bottom' | 'left' | 'right';
export type ChipPlacement =
  | 'top-left'    | 'top-center'    | 'top-right'
  | 'center-left' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type ChipSize = 'sm' | 'md' | 'lg';

interface BaseTagOptions {
  color?: string;
  /** Label text. Pass `''` to suppress. Default: auto ("Page 1", "Page 2", …) */
  label?: string;
  textColor?: string;
  opacity?: number;
}

export interface BarTagOptions extends BaseTagOptions {
  type: 'bar';
  placement?: BarPlacement;
  thickness?: number;
  /** Offset from anchor edge in px. Pass `null` to revert to flush. */
  x?: number | null;
  y?: number | null;
}

export interface ChipTagOptions extends BaseTagOptions {
  type?: 'chip';
  placement?: ChipPlacement;
  /** Absolute position override. Pass `null` to revert to named placement. */
  x?: number | null;
  y?: number | null;
  size?: ChipSize;
}

export type PageTagOptions = BarTagOptions | ChipTagOptions;

/** The tag handle returned by {@link pageTag}. */
export interface PageTagHandle {
  /**
   * Override position with absolute coordinates.
   * - Chip: positions at (x, y) from top-left
   * - Bar: offsets from anchor edge (y for top/bottom, x for left/right)
   * Pass `null` to revert an axis to its placement anchor.
   */
  moveTo(x: number | null, y: number | null): Promise<void>;
  /** Temporarily hide the tag. */
  hide(): Promise<void>;
  /** Restore after hiding. */
  show(): Promise<void>;
  /**
   * Hide the tag for the duration of `fn`, then restore it.
   * Safe to wrap around screenshots, snapshot assertions, or any visual check.
   *
   * @example
   * await tag.hideDuring(() => expect(page).toHaveScreenshot());
   */
  hideDuring<T>(fn: () => Promise<T>): Promise<T>;
  /** Remove the tag and its navigation listener entirely. */
  remove(): Promise<void>;
}

// ── Size presets ──────────────────────────────────────────────────────────────

const CHIP_SIZES: Record<ChipSize, { fontSize: string; padding: string; borderRadius: string }> = {
  sm: { fontSize: '9px',  padding: '2px 7px',  borderRadius: '12px' },
  md: { fontSize: '11px', padding: '3px 10px', borderRadius: '16px' },
  lg: { fontSize: '13px', padding: '5px 14px', borderRadius: '20px' },
};

// ── Placement → CSS ───────────────────────────────────────────────────────────

type StyleMap = Record<string, string>;
const MARGIN = 12;

function chipPlacementCSS(p: ChipPlacement): StyleMap {
  const base: StyleMap = { top: 'auto', bottom: 'auto', left: 'auto', right: 'auto', transform: 'none' };
  const [v, h] = p.split('-') as [string, string];
  if (v === 'top')    base.top    = `${MARGIN}px`;
  if (v === 'bottom') base.bottom = `${MARGIN}px`;
  if (v === 'center') base.top    = '50%';
  if (h === 'left')   base.left   = `${MARGIN}px`;
  if (h === 'right')  base.right  = `${MARGIN}px`;
  if (h === 'center') base.left   = '50%';
  if (v === 'center' && h === 'center') base.transform = 'translate(-50%, -50%)';
  else if (v === 'center')              base.transform = 'translateY(-50%)';
  else if (h === 'center')              base.transform = 'translateX(-50%)';
  return base;
}

function barPlacementCSS(p: BarPlacement, thickness: number): StyleMap {
  const t = `${thickness}px`;
  switch (p) {
    case 'top':    return { top: '0',    left: '0', right: '0',  bottom: 'auto', width: '100%',  height: t };
    case 'bottom': return { bottom: '0', left: '0', right: '0',  top:    'auto', width: '100%',  height: t };
    case 'left':   return { left: '0',   top: '0',  bottom: '0', right:  'auto', height: '100%', width:  t };
    case 'right':  return { right: '0',  top: '0',  bottom: '0', left:   'auto', height: '100%', width:  t };
  }
}

function barWritingMode(p: BarPlacement): string {
  if (p === 'left')  return 'vertical-lr';
  if (p === 'right') return 'vertical-rl';
  return 'horizontal-tb';
}

// ── DOM injection ─────────────────────────────────────────────────────────────

async function inject(page: Page, id: string, styles: StyleMap, label: string) {
  await page.evaluate(({ id, styles, label }) => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.setAttribute('data-pw-tag', '');
      document.documentElement.appendChild(el);
    }
    Object.assign(el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
    }, styles);
    el.textContent = label;
  }, { id, styles, label });
}

// ── Bar ───────────────────────────────────────────────────────────────────────

async function createBar(
  page: Page, id: string,
  color: string, textColor: string, label: string,
  placement: BarPlacement, thickness: number, opacity: number,
  initX: number | null | undefined, initY: number | null | undefined,
): Promise<{ handle: PageTagHandle; cleanup: () => void }> {
  let offsetX = initX ?? null;
  let offsetY = initY ?? null;
  let visible = true;

  const styles = (): StyleMap => {
    const pos: StyleMap = {};
    if (placement === 'top'    && offsetY != null) pos.top    = `${offsetY}px`;
    if (placement === 'bottom' && offsetY != null) pos.bottom = `${offsetY}px`;
    if (placement === 'left'   && offsetX != null) pos.left   = `${offsetX}px`;
    if (placement === 'right'  && offsetX != null) pos.right  = `${offsetX}px`;
    return {
      ...barPlacementCSS(placement, thickness),
      ...pos,
      background: color, color: textColor, opacity: String(opacity),
      fontSize: '10px', fontWeight: '600', fontFamily: 'system-ui, sans-serif',
      letterSpacing: '0.5px', writingMode: barWritingMode(placement),
    };
  };

  const apply = () => inject(page, id, styles(), label);
  const onNavigated = () => { if (visible) apply().catch(() => {}); };
  page.on('framenavigated', onNavigated);
  await apply();

  const cleanup = () => page.off('framenavigated', onNavigated);

  const hide = async () => { visible = false; await page.evaluate((id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; }, id); };
  const show = async () => { visible = true;  await page.evaluate((id) => { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }, id); };

  const handle: PageTagHandle = {
    async moveTo(x, y) { offsetX = x; offsetY = y; await apply(); },
    hide,
    show,
    async hideDuring(fn) { await hide(); try { return await fn(); } finally { await show(); } },
    async remove() {
      cleanup();
      _active.delete(page);
      await page.evaluate((id) => document.getElementById(id)?.remove(), id);
    },
  };

  return { handle, cleanup };
}

// ── Chip ──────────────────────────────────────────────────────────────────────

async function createChip(
  page: Page, id: string,
  color: string, textColor: string, label: string,
  placement: ChipPlacement, size: ChipSize, opacity: number,
  initX: number | null | undefined, initY: number | null | undefined,
): Promise<{ handle: PageTagHandle; cleanup: () => void }> {
  let overrideX: number | null = initX ?? null;
  let overrideY: number | null = initY ?? null;
  let visible = true;
  const sz = CHIP_SIZES[size];

  const styles = (): StyleMap => {
    const pos: StyleMap = overrideX != null || overrideY != null
      ? {
          top:    overrideY != null ? `${overrideY}px` : 'auto',
          left:   overrideX != null ? `${overrideX}px` : 'auto',
          right:  overrideX != null ? 'auto' : (chipPlacementCSS(placement).right  ?? 'auto'),
          bottom: overrideY != null ? 'auto' : (chipPlacementCSS(placement).bottom ?? 'auto'),
          transform: 'none',
        }
      : chipPlacementCSS(placement);
    return {
      ...pos,
      background: color, color: textColor, opacity: String(opacity),
      fontSize: sz.fontSize, fontWeight: '600', fontFamily: 'system-ui, sans-serif',
      letterSpacing: '0.5px', padding: sz.padding, borderRadius: sz.borderRadius,
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)', lineHeight: '1.4', whiteSpace: 'nowrap',
    };
  };

  const apply = () => inject(page, id, styles(), label);
  const onNavigated = () => { if (visible) apply().catch(() => {}); };
  page.on('framenavigated', onNavigated);
  await apply();

  const cleanup = () => page.off('framenavigated', onNavigated);

  const hide = async () => { visible = false; await page.evaluate((id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; }, id); };
  const show = async () => { visible = true;  await page.evaluate((id) => { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }, id); };

  const handle: PageTagHandle = {
    async moveTo(x, y) { overrideX = x; overrideY = y; await apply(); },
    hide,
    show,
    async hideDuring(fn) { await hide(); try { return await fn(); } finally { await show(); } },
    async remove() {
      cleanup();
      _active.delete(page);
      await page.evaluate((id) => document.getElementById(id)?.remove(), id);
    },
  };

  return { handle, cleanup };
}

// ── PageTag class (statics) ───────────────────────────────────────────────────

/** Static helpers for {@link pageTag}. */
export class PageTag {
  /** The built-in color palette (cycles automatically). */
  static readonly palette: readonly string[] = PALETTE;

  /**
   * Reset the auto-color counter and all label generators created by
   * {@link labelFor}. Call between test runs if you want sequences to restart.
   */
  static reset() {
    _counter = 0;
    _labelGens.forEach(g => g.reset());
  }

  /**
   * Create a per-prefix label generator. Designed to be used as a static
   * on a POM class so each instance gets a numbered label automatically.
   *
   * @example
   * class AdminPage {
   *   private static _label = PageTag.labelFor('Admin');
   *
   *   async goto() {
   *     await pageTag(this.page, { type: 'bar', label: AdminPage._label.next() });
   *     // first instance → "Admin 1", second → "Admin 2", etc.
   *   }
   * }
   */
  static labelFor(prefix: string): { next(): string; reset(): void } {
    let n = 0;
    const gen = { next: () => `${prefix} ${++n}`, reset: () => { n = 0; } };
    _labelGens.push(gen);
    return gen;
  }
}

// ── Factory function ──────────────────────────────────────────────────────────

/**
 * Tags a Playwright page with a visual indicator for headed-mode debugging.
 *
 * - One tag per page: calling `pageTag` on a page that already has a tag
 *   automatically removes the old one first (listener included).
 * - Tags have `pointer-events: none` and survive SPA navigations.
 * - Use `hideDuring()` to suppress the tag around visual assertions.
 *
 * @example
 * // Automatic color + label
 * const tag = await pageTag(page);
 *
 * // Bar on left edge
 * const tag = await pageTag(page, { type: 'bar', placement: 'left', label: 'Admin' });
 *
 * // Chip with named placement, temporarily moved
 * const tag = await pageTag(page, { placement: 'top-right' });
 * await tag.moveTo(25, 400);    // absolute override
 * await tag.moveTo(null, null); // snap back to top-right
 *
 * // Hide during a visual assertion
 * await tag.hideDuring(() => expect(page).toHaveScreenshot());
 *
 * // POM usage with per-class label counter
 * class AdminPage {
 *   private static _label = PageTag.labelFor('Admin');
 *   async goto() {
 *     await pageTag(this.page, { type: 'bar', label: AdminPage._label.next() });
 *   }
 * }
 */
export async function pageTag(
  page: Page,
  options: PageTagOptions = {} as ChipTagOptions,
): Promise<PageTagHandle> {
  // Auto-remove existing tag for this page
  const prev = _active.get(page);
  if (prev) { prev.cleanup(); await prev.handle.remove(); }

  const idx       = nextIndex();
  const color     = options.color     ?? PALETTE[idx % PALETTE.length]!;
  const textColor = options.textColor ?? contrastColor(color);
  const label     = options.label     !== undefined ? options.label : `Page ${idx + 1}`;
  const opacity   = options.opacity   ?? 0.9;
  const id        = `__pw_tag_${idx}_${Math.random().toString(36).slice(2)}`;

  const result = options.type === 'bar'
    ? await createBar(
        page, id, color, textColor, label,
        options.placement ?? 'top',
        options.thickness ?? 5,
        opacity, options.x, options.y,
      )
    : await createChip(
        page, id, color, textColor, label,
        (options as ChipTagOptions).placement ?? 'top-right',
        (options as ChipTagOptions).size      ?? 'md',
        opacity,
        (options as ChipTagOptions).x,
        (options as ChipTagOptions).y,
      );

  _active.set(page, result);
  return result.handle;
}
