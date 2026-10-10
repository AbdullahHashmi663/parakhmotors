# Parakh Motors

## Brand idea

**A better way to buy, sell & own.**

Parakh makes a car decision feel informed and manageable. Speak with the calm confidence of a knowledgeable local expert. Describe the actual service, explain the next step, and make costs and expectations easy to find. Use short sentences, familiar language and helpful detail. Avoid promises such as “100% certified”, “guaranteed returns” or unverified customer counts.

## Logo

The original automotive crest frames a sculpted front-facing car inside a tapered shield. Its balanced roofline, angular headlights and fine inset suggest precision and care. A small diamond completes the crest. The custom uppercase PARAKH wordmark and widely spaced MOTORS signature are drawn entirely as vector paths, so their appearance never depends on a font loading.

- `public/brand/parakh-logo.svg`: primary presentation on a white background.
- `public/brand/logo-dark.svg`: reverse presentation on forest green.
- `public/brand/mark.svg`: simplified car crest for a favicon or avatar.
- `public/brand/apple-touch-icon.png`: 180px home screen icon.
- `src/app/favicon.ico`: 16, 32, 48 and 64px browser icons.
- `src/lib/brand-logo.ts`: shared source geometry for all variants.
- `src/components/BrandLogo.tsx`: responsive in-product identity. `compact` shows the mark alone; `inverse` provides the reverse variant.

Use the primary asset on ivory or white and the reverse asset on forest green. The in-product logo follows the selected Theme studio palette using readable foreground/background pairs; its geometry stays the same. Keep the full signature at least 160px wide; use the mark alone below that size, with a minimum digital size of 24px. Browser icons use a simplified crest with stronger car outlines to remain recognizable at 16px. Preserve the aspect ratio and leave clear space at least equal to one quarter of the mark height. Do not add shadows, gradients, extra outlines or additional symbols to the logo.

Run `node scripts/generate-brand-assets.mjs` after changing the shared geometry to regenerate the static SVG signatures, browser icons and logo preview together.

## Color

- Warm ivory `#f7f8f2`: primary page surface.
- Forest green `#153e35`: identity, main actions and footer.
- Deep ink `#182420`: body copy and headings.
- Soft lime `#d7edaf`: accents and reverse actions.
- Stone line `#dce2d8`: separators and borders.
- Muted leaf `#626e62`: secondary text on light surfaces.

Maintain readable contrast. Use forest green text on lime; use ivory text on forest green. Lime is an accent, not body text on ivory.

## Typography and layout

Favor a clear modern sans serif with generous line spacing. Large headings use restrained weight and close tracking. Small eyebrow labels use spaced uppercase letters. The logo keeps its own uppercase sans serif wordmark.

Use a 1280px content width, comfortable page gutters, substantial space around primary content, and subtle rounded corners. A few large images and purposeful composition carry the visual identity. Keep controls at least 44px high. Use visible keyboard focus and respect reduced-motion preferences.

## Customer navigation

Keep the primary journey simple: Home, Our services, Buy a car, Sell your car and About us. Book an inspection is the main header action. Secondary services, contact, privacy and team access are in the footer. Use the saved dealership settings for phone, email, WhatsApp, address and opening hours.

