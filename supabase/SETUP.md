# Quote Rescue — Supabase setup (stage 1)

**Status:** Database schema prepared; no Supabase project connected yet. Existing app remains local-only. Do not upload actual customer data until login, permissions and backup/restore are tested.

1. Create a Supabase project at https://supabase.com/dashboard and choose a strong database password. Keep it private.
2. In the SQL Editor, run `supabase/schema.sql`.
3. Under Authentication, configure email confirmation, password policies and allowed redirect URLs for your exact production origin. Turn on MFA when available.
4. In the Table Editor, confirm RLS is enabled for `businesses`, `quotes` and `quote_events`. Use **two separate test accounts** to confirm neither can view, update or delete the other's records.
5. Only the **publishable/anon** client key may be used in browser code, with verified RLS. Never publish the service_role/secret key, database password, AI API key or OAuth client secret.
6. Before replacing localStorage, implement explicit opt-in migration with export backup, deduplication and verification. Test data deletion, backups, sessions, password reset and multi-device access.

**Still to implement:** browser authentication UI, Supabase client, data migration, server-side AI endpoint, OAuth mail integration, queued automation, monitoring and privacy/legal review. This migration file alone does not make the live site cloud-backed or secure for production.

**Deployment note:** SQL policies restrict access by owner. They are a foundation, not a security audit. Production should also have rate limits, logging, secure session handling, backups and automated cross-account access tests.
