# Expert Technologies MVP Update

This update is based on the client MVP checklist and the latest project source.

## Included

- Ticket status simplified to Open / Closed.
- Ticket priority simplified to Low / Medium / High.
- Appointment/service date, start time, end time, and due date.
- Multiple technician assignment per ticket.
- Monthly and quarterly recurring service appointments.
- Ticket table and monthly calendar scheduling view with technician filter.
- Upcoming Service Calendar widget on the dashboard.
- Printable work-ticket layout with customer/issue details, work performed, time on site, materials/equipment used, and signature lines.
- Ticket attachments/photos using Django media storage.
- Technician assignment emails, new-ticket manager emails, and closed-ticket email to managers@experttechnology.net.
- Technician performance reporting with date and technician filters.
- Admin-only CSV report export.
- Admin-only customer CSV import for Autotask client migration.
- Equipment Owned / Leased tracking, lease provider, and lease end date.
- Inbound email and Datto/RMM ticket endpoint groundwork protected by environment secrets.
- Expert Technology support email, phone, and Central Time defaults.
- Manager system role added without overwriting existing Technician role permissions.

## Technician permissions

No new global Technician read-only permission layer was added. Existing project behavior is preserved: linked technicians continue to use the project's existing ticket visibility/edit rules. The new MVP work does not force technicians into the broader read-only access change that was intentionally removed from scope.

## After pulling/replacing the files

Run the backend migrations:

```bash
cd backend
python manage.py migrate
```

Then install/build the frontend normally:

```bash
cd ../frontend
npm install
npm run build
```

## Production configuration still required

### Email

Set SMTP environment variables from `backend/.env.example`. Without a production mail provider, notification code will not send real email.

### Attachments

The MVP uses Django `MEDIA_ROOT`. This works locally and on servers with persistent storage. If the Django backend is hosted on a serverless/ephemeral filesystem such as Vercel Functions, use persistent object storage (for example S3-compatible storage) before relying on uploaded attachments in production.

### Inbound email / Datto

The source contains protected inbound endpoints, but a real inbound email parser/webhook must be connected separately. Configure `INBOUND_EMAIL_SECRET` and/or `DATTO_INBOUND_SECRET` before enabling those integrations.

## Vercel production database migrations

The backend now includes `backend/pyproject.toml` with a Vercel build script that runs Django migrations automatically whenever a deployment has a configured PostgreSQL database URL (`DATABASE_URL`, `POSTGRES_URL`, or `DATABASE_URL_UNPOOLED`).

This prevents deployed code from querying newer model fields before the production schema has been updated. In particular, the current Locations, Equipment, and Tickets APIs require migrations added after their initial tables were created.
