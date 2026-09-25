-- Grant (or revoke) the admin role for an existing account. There is no API or
-- UI for this on purpose: it is an operator action against the auth database.
--
--   docker compose:
--     docker compose exec -T postgres psql -U postgres -d auth_db \
--       -v email='owner@example.com' -f - < database/scripts/grant-admin.sql
--   Kubernetes (Azure Postgres):
--     psql "$AUTH_DB_URL" -v email='owner@example.com' -f database/scripts/grant-admin.sql
--
-- To revoke, run the same with -v role=customer. The user must sign in again
-- for the new role to take effect (it is carried in the access token).
\set ON_ERROR_STOP on
\if :{?role}
\else
  \set role admin
\endif

UPDATE users
SET role = :'role', updated_at = CURRENT_TIMESTAMP
WHERE LOWER(email) = LOWER(:'email')
RETURNING id, email, role;
