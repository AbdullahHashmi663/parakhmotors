# Parakh Motors motion system

Motion follows the brand: a confident entrance, considered pacing, and useful feedback. Native scrolling and the existing page-top navigation remain intact.

## Engines and ownership

- GSAP 3.15 + ScrollTrigger: hero choreography, staggered section/card reveals, desktop photo parallax, inspection SVG strokes, reading progress, navigation, galleries, dialogs, and admin transitions.
- Anime.js 4.5: press responses, shortlist hearts, package choices, result-count changes, FAQ text, and form status/icon feedback.
- CSS: hover/focus arrows and icons, card lift using the individual `translate` property, input focus, and progressively enhanced native FAQ height transitions.

`MotionScene` marks each committed page ready. `SiteMotion` only touches ready scenes, preventing mutations of streamed HTML before hydration. Pages retain visible server-rendered content when JavaScript is unavailable. The observer adds newly mounted inventory items and reverts detached nodes.

## Component tags

- `data-motion="hero"`: entrance sequence for direct `data-motion-item` children.
- `data-motion="stagger"`: viewport reveal for direct `data-motion-item` children.
- `data-motion="heading"` or `"reveal"`: a restrained rise and fade.
- `data-motion="image"`: an image wrapper reveal; parallax only above 900px with a fine pointer. Keep overflow clipped and floating labels outside the wrapper when necessary.
- `data-motion="draw"`: SVG outlines reveal when entering view.
- `data-motion-hover="lift"`: card elevation on precise-pointer hover.
- `data-motion-press`: Anime.js press feedback for buttons and action links.
- `data-motion-feedback="heart"`, `"choice"`, or `"accordion"`: event-specific feedback.

Avoid tagging both a container and all its descendants for the same entrance. Avoid competing transform animations on one element; icons and content wrappers provide separate feedback targets. Native dialog lifecycle and focus restoration stay component-owned.

## Accessibility and cleanup

Reduced-motion changes revert animations immediately, including parallax, reveal styles, menus, and dialogs. Keyboard focus completes a pending ancestor reveal, so focused controls are visible. Closed mobile menus become inert before their exit. Dialogs close natively before React removes them, restoring focus without scrolling.

GSAP contexts and media queries revert on route changes/unmount; Anime scopes/instances revert on replacement and cleanup. No scroll smoothing, pinning, pointer replacement, or continuous decorative loops are used.

## Verification

- Production build and TypeScript passed; all 23 routes generated.
- Project lint passed with no errors; two existing unused-import warnings remain in legacy components.
- All eight customer routes opened at scroll position zero, contained motion tags, and had no horizontal overflow. Browser logs were clean after the readiness handshake.
- Mobile menu open/exit/Escape and rapid toggles passed. Search empty/results transitions, heart state, gallery changes, and native dialog exits passed.
- Keyboard-opened vehicle details returned focus to their explicit trigger; the admin editor returned focus to Add a vehicle. Body scroll locking cleared after both dialogs closed.
- All eight admin sections were checked on desktop; booking package selection, input focus visibility, and native FAQ expansion/collapse were checked.
- At 1280px the hero image had the parallax transform; resizing to 390px removed it. Both sizes had no horizontal overflow. Temporary viewport overrides and test selections were cleared.
- Reduced-motion behavior was reviewed in code; browser preference emulation was unavailable in the supported testing API.
- Preview captures: `screenshots/motion-homepage-desktop.png` and `screenshots/motion-homepage-mobile.png`.

## References

- [GSAP contexts](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/) and [responsive media queries](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/)
- [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Anime.js in React](https://animejs.com/documentation/getting-started/using-with-react/)
- [Native details-content transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::details-content)
