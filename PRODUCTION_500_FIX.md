# Production API 500 Fix

## What was happening

The deployed Django code includes newer model fields for Locations, Equipment, and Tickets, but a Vercel deployment did not automatically run the corresponding PostgreSQL migrations. When Django queried those tables, PostgreSQL could be missing columns introduced by the newer migration files, which results in HTTP 500 responses.

Affected API symptoms included:

- `/api/locations/` -> 500
- `/api/equipment/` -> 500
- `/api/tickets/` -> 500

while older endpoints such as `/api/customers/` could still return 200.

## Fix included

`backend/pyproject.toml` now contains the Python dependencies and an official Vercel build script that runs:

```bash
python manage.py migrate --noinput
```

when a PostgreSQL database URL is configured. This applies pending Django migrations before the new deployment serves requests.

The Locations page was also adjusted so that an API failure shows the error state by itself instead of simultaneously showing the misleading `No locations found` empty state.

## After uploading/pushing this version

Redeploy the **backend** Vercel project. During the build, confirm the deployment log contains Django migration output. Then verify these endpoints from the app:

1. Locations loads without HTTP 500.
2. Equipment loads without HTTP 500.
3. Tickets loads without HTTP 500.
4. Add Location can create a location for an existing customer.
5. Dashboard live counts load normally.

Do not delete or reset the production database. The fix uses normal incremental Django migrations.
