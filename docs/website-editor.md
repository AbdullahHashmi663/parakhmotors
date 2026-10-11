# Website editor

Sign in at `/admin` and choose **Website editor** in the sidebar.

- **Contact & business:** business name, tagline, announcement, phone, WhatsApp number and message, email, address, working hours, service areas, map/social links and sourcing payment instructions.
- **Services & prices:** package titles, fees in PKR, descriptions, included features, payment notes, availability and sourcing budget thresholds. Add, remove, reorder and feature service cards.
- **Page content:** select a customer page and edit its introduction, image, headings, process, form introduction, FAQs, extra sections and closing message.
- **Homepage & about:** edit homepage content/images, company story, statistics, values and common questions.
- **Footer & privacy:** update the final message, footer copy and privacy sections.

Use **Save & publish** to save all sections together. **Discard changes** restores the last saved values. Switching editor sections keeps the draft. Leaving with unpublished changes asks before discarding it. Open **View website** to check the result.

Refresh loads the latest published details into a clean editor. Save or discard any draft before refreshing; older pending refreshes cannot replace a successful publication.

The “Insert current detail” picker adds readable references such as `[Car inspection fee]` or `[Phone number]`. These resolve from the current saved settings, so FAQs stay up to date when a price or number changes.

Images accept existing `/images/...` or `/brand/...` raster paths and HTTPS links from `images.unsplash.com`. An empty customer-page hero image hides the photograph. Currency remains PKR because vehicle prices and existing records use Pakistani rupees.

Updates are stored in the connected PostgreSQL database. Public pages receive the saved content during server rendering and refresh it on navigation, focus and periodically while visible. Saves update the current browser and notify other tabs. Server booking routes choose fees from the saved packages, reject disabled packages and snapshot the fee on each new request. Changing a fee does not rewrite earlier bookings.

For an existing deployment, run `npm run db:migrate:content` before starting the updated application. The idempotent migration adds the content column without replacing inventory, customer records or existing settings.

Validation: `node scripts/verify-content-validation.mjs` checks content safety, request size and service pricing behavior. With a development server running, `npm run test:content` checks authenticated saving, public reads, persistence and authoritative booking fees. It restores the original content and removes its own temporary requests. Run it without simultaneous admin edits.
