# Selling request photos

Customers can attach up to six optional JPG, PNG or WebP car photos to **Sell your car** and **Investor cash offer** requests. Each original can be up to 5 MB. The form shows previews, lets the customer remove individual photos, and optimizes the images before submission.

Photos are saved with the request in the connected database. Admins can review thumbnails under **Sell requests** and open a photo at full size. Photo access requires the admin session; the website does not publish customer photos in its inventory.

Before deploying this update to an existing database, run `npm run db:migrate:photos`. This idempotent migration adds a private photo table and preserves existing requests. It uses the existing database connection and requires no additional storage credentials. New databases get the same table from `supabase/schema.sql`.

The server independently checks the upload size, count, declared and decoded image types, and image dimensions. It decodes and re-encodes still photos as WebP, applies orientation, strips metadata and stores the request and images together in one transaction. Deleting a seller request also removes its attached photos. Older requests and submissions without photos continue to work.

With the development server running, `npm run test:sell-photos` checks persistence, private access, orientation, metadata removal, invalid uploads and older JSON submissions. The test creates its own generated photos and temporary seller requests, then removes only those records; it preserves business content and prices.
