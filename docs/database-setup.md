# Database and administration

The website uses server-side PostgreSQL queries against Supabase. All inventory,
bookings, inquiries, selling requests, sourcing requests, themes and dealership
settings are stored there. The local JSON file is a migration source, never a
runtime fallback.

Server configuration lives in the ignored `.env.local` file:

- `DATABASE_URL`: Supabase Session pooler URI, including the database password.
- `ADMIN_PASSWORD`: initial administrator password for database bootstrap; later password changes are stored as scrypt hashes in the database.
- `ADMIN_USERNAME`: initial administrator username (defaults to `parakhmotors777`).
- `ADMIN_RECOVERY_EMAIL`: administrator email for one-time login and password-reset codes.
- `RESEND_API_KEY`: server-only Resend API key.
- `ADMIN_FROM_EMAIL`: sender address on a domain verified in Resend.
- `ADMIN_SESSION_SECRET`: at least 32 characters; signs expiring administrator sessions.
- `DATABASE_SSL_CA_PATH`: optional custom CA file. The included official Supabase
  certificate is used by default.
- `TRUST_PROXY`: leave unset unless deployment supplies a trusted forwarding header.

Keep these server-only variables out of `NEXT_PUBLIC_*` variables and source control.
Use the deployment platform's secret settings for a hosted instance. Restart the
server after changing credentials. Rotating the administrator password or session
secret invalidates existing sessions. Resetting the database-backed password also
invalidates all existing admin sessions and outstanding email codes.

The certificate in `supabase/certs/prod-ca-2021.crt` came from
[Supabase's official HTTPS download](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt),
referenced in their
[dashboard configuration](https://raw.githubusercontent.com/supabase/supabase/master/apps/studio/hooks/custom-content/custom-content.json).
TLS verifies the certificate and hostname. The certificate is included in production
server output. The Session pooler supports this machine's IPv4 network;
[Supabase's connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
explains the alternatives.

Run `npm run db:check` to verify connectivity without changing data.
Run `npm run db:setup` to apply the transactional initial schema and migration.
For an existing installation, run `npm run db:migrate:content` to add storage for
the Website editor. This adds a column without overwriting existing records.
The migration inserts missing records, preserves existing IDs, records completion,
and does not repeat seeding on subsequent runs. The six known demonstration
customer records are excluded. Existing non-demo local submissions are preserved.

Run `npm run db:migrate:admin` for an existing database to add private account,
one-time code and rate-limit tables. It seeds the initial username, a salted scrypt
password hash and the recovery email only when the account is missing. Re-running
the migration preserves the password and recovery address already stored.

Open `/admin` to sign in with the administrator username and password, or request
an eight-digit code at the account's registered email. The Forgot password option
requires a separate password-reset code before accepting a new password of at
least 12 characters. Codes expire after 10 minutes, work once, and permit at most
five verification attempts. Login codes cannot reset passwords. Code requests
have a one-minute cooldown and database-backed request limits that work across
server instances. Anonymous and authenticated Supabase clients cannot read
credentials, challenge hashes or authentication limits.

Run `npm run test:admin` for account and code security checks. This creates a
temporary account, mocks delivery (no emails are sent), checks expiry, replay,
failed-code limits, simultaneous code use, password-reset session revocation and
database-role privacy, then removes its test records. Other integration scripts
use `ADMIN_USERNAME` and the bootstrap `ADMIN_PASSWORD`; set `TEST_ADMIN_PASSWORD`
to the current password if it has since been reset in the application.

Customer lists and every management mutation require a
signed, HttpOnly, eight-hour session. Customer data is also inaccessible to
anonymous Supabase roles. Public forms submit through validated server routes.
Theme changes update the active theme and settings together in a transaction.
Restoring default appearance preserves all inventory and customer records.

With the website running, `npm run test:integration` verifies customer submissions,
database persistence, inventory CRUD, status changes, theme/settings saves,
invalid inputs, expired/forged sessions, cross-origin protection and database role
privacy. It creates clearly marked temporary records, removes only those records,
and restores the settings and active theme it started with. Run it against a
development instance without simultaneous admin edits. `TEST_BASE_URL` can select
another local test port.

The forms record requests for the dealership team. Confirming appointments,
reviewing valuations and arranging sourcing/payment remain team-managed steps.
# Selling request photos

For an existing database, run `npm run db:migrate:photos` to add private photo attachments for seller requests. See [selling request photos](sell-car-photos.md) for usage and verification.
