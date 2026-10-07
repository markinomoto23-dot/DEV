# Customer-Centered Update

This update changes the primary customer workflow to:

Customers -> Customer Record -> Locations -> Equipment -> Licenses / Warranties -> Tickets -> Billing

## What changed

- Added `/customers/:customerId` customer record route.
- Added a customer detail page with tabs for Overview, Locations, Equipment, Licenses, Warranties, Tickets, and Billing.
- Added an Open Customer Record button in the Customers table.
- Customer sidebar state stays active while viewing a specific customer.
- Added backend query filtering so related records can be loaded by customer ID:
  - `/api/locations/?customer=<id>`
  - `/api/equipment/?customer=<id>`
  - `/api/licenses/?customer=<id>`
  - `/api/warranties/?customer=<id>`
  - `/api/tickets/?customer=<id>`
  - `/api/billing/?customer=<id>`
- Existing global modules remain available for cross-customer administration.

## Database

No model changes were made, so this update does not require a new Django migration.

## Apply

Copy the files in this patch over the matching files in the existing project, then restart Django and the Vite frontend.

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
python manage.py runserver
```

## Production

Rebuild/redeploy the frontend after applying the update. Keep the existing backend environment variables and database files; this patch does not replace them.
