# Cross-Platform Viewport and PWA Display Configuration

- **Unit ID**: `SPEC-006`
- **Category**: integration
- **Priority**: critical
- **Purpose**: Establish the viewport meta, iOS-specific meta tags, and PWA manifest fields that make full-screen, zero-scroll rendering possible and eliminate OS/browser chrome that would otherwise invite gesture navigation.
- **Scope**:
  - Included: `<meta name="viewport">`; `<meta name="apple-mobile-web-app-capable">`; `<meta name="apple-mobile-web-app-status-bar-style">`; PWA manifest `display`, `orientation`, `start_url`.
  - Excluded: Service worker caching policy; icons.
- **Dependencies**: None.

## Preconditions
- `index.html` and `public/manifest.json` exist in the repository.

## Behavior
- `<meta name="viewport">` MUST include, at minimum: `width=device-width`, `initial-scale=1.0`, `maximum-scale=1.0`, `user-scalable=no`, `viewport-fit=cover`, and `interactive-widget=resizes-content`. The `viewport-fit=cover` directive lets the app render under safe-area insets; `user-scalable=no` + `maximum-scale=1.0` disable pinch-zoom which would otherwise interact with the touchmove prevention logic.
- `<meta name="apple-mobile-web-app-capable" content="yes">` MUST be present so iOS hides browser chrome when installed to the home screen.
- `<meta name="mobile-web-app-capable" content="yes">` SHOULD be present (the non-prefixed equivalent for Android Chrome).
- `<meta name="apple-mobile-web-app-status-bar-style">` MUST be set to a value compatible with the theme (`default`, `black`, or `black-translucent`).
- The PWA manifest MUST set `"display": "standalone"` (already present) or `"fullscreen"`.
- The manifest MUST set `"orientation": "portrait"` (already present) if the game is portrait-only; otherwise the value MUST match the game's supported orientations.

## Postconditions
- Loading the app on iOS Safari from home screen shows no address bar, no tab bar, no edge-swipe history.
- Pinch-zoom does not scale the page on mobile.
- Safe-area insets are exposed via `env(safe-area-inset-*)` CSS variables for use by the layout.

## Invariants
- The set of meta tags does not regress between releases.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| `user-scalable=yes` accidentally re-added | Pinch-zoom re-enables; touchmove listener may conflict | `user-scalable=no` MUST remain. |
| `display: browser` in manifest | Browser chrome shows; edge-swipe navigates history | MUST be `standalone` or `fullscreen`. |

## State Transitions
Not applicable.

## Constraints
- The viewport meta tag MUST be a single, consolidated tag (browsers honor only the first).
- `maximum-scale=1.0` MUST be kept despite accessibility concerns because the game depends on a stable gesture surface; users needing zoom can use OS-level magnifiers.

## Examples
- Example A (already satisfied by current `index.html`):
  `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`
  — MUST be extended with `interactive-widget=resizes-content`.
- Example B: Manifest already has `"display": "standalone"`.

## Related Units
- SPEC-001, SPEC-002, SPEC-004 (depend on this configuration).
