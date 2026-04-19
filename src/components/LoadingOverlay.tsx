import { useAtomValue } from 'jotai';
import { isGeneratingAtom } from '../store/game';

// Traces to: SPEC-008. Full-viewport overlay that renders when
// isGeneratingAtom is true and renders nothing otherwise. The overlay:
//   - covers the whole viewport so the board behind it cannot be tapped
//   - uses only existing Tailwind design tokens (bg-paper, text-ink,
//     text-accent, border-accent) — no new colors
//   - sits at z-40 so it is above the board / number pad (z-0..z-20) but
//     below the win modal (z-50)
//   - exposes no interactive controls (aria-busy, role=status)
export function LoadingOverlay() {
  const isGenerating = useAtomValue(isGeneratingAtom);

  if (!isGenerating) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-paper/90 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="loading-overlay"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin"
          aria-hidden="true"
        />
        <p className="text-ink font-medium text-sm">Generating puzzle...</p>
      </div>
    </div>
  );
}
