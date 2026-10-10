# Parakh Motors website redesign

## Delivered

- Complete new homepage and eight customer pages: services, inspections, selling, car sourcing, about, contact, investor offers and privacy.
- Custom geometric PM identity, SVG wordmark variants, browser favicon and Apple touch icon.
- Original campaign photograph, optimized to WebP, and a local variable font.
- Ivory, evergreen and lime semantic design tokens, responsive layouts, reduced-motion support and visible keyboard focus.
- Searchable inventory with make, body and budget filters, a session shortlist, vehicle photo gallery and enquiry dialog.
- Rebuilt showroom admin workspace with all existing inventory, booking, request, settings and theme management actions.
- Unique page titles, descriptions, social sharing metadata and non-indexed admin.

## Validation

- Production build passed and all 23 routes generated successfully.
- Full source lint passed with zero errors or warnings.
- Desktop checked at 1440px; all customer routes and the admin workspace checked at 390px with no page-level horizontal overflow.
- Browser checks verified inventory search, shortlist selection, native vehicle dialog, mobile menu, admin sign-in, all eight admin sections and vehicle editor opening/cancellation.
- Actual local submissions passed for a vehicle enquiry, contact enquiry, inspection, selling request and car sourcing request.
- The complete deal booking returned the advertised Rs. 30,000 fee. The inspection package selects the Rs. 7,000 basic service.
- All five temporary form-check records were deleted through their corresponding local API endpoints; no QA records remain.

## Assets and configuration

See `brand-guidelines.md` for identity guidance and `image-assets.md` for the original ImageGen prompt and asset paths. Preview captures are in `screenshots/`.

Set `NEXT_PUBLIC_SITE_URL` to the actual deployment origin for social images. The site currently runs locally; it has not been published by this redesign task. Existing contact data is loaded from the saved dealership settings. Theme studio selections now control the public website and admin portal through semantic color tokens, including the in-product logo, forms, cards, and hover states. Saved selections persist in the database and refresh other open tabs.

Text and action foregrounds are derived for readable contrast. Custom card backgrounds that conflict with the shared text color are gently blended toward the page background. Run `node scripts/verify-theme-tokens.mjs` to check body, secondary text, actions, inverse sections, and focus colors across the built-in and custom test palettes.
