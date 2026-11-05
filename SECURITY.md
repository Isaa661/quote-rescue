# Quote Rescue — security and production launch requirements

## Current status
This is a static, offline-first prototype hosted on GitHub Pages. Customer records are stored in the browser's localStorage, **not encrypted at rest**, and are not synchronised. Anyone with access to the same unlocked browser/device profile may be able to read them. Avoid storing sensitive customer information until production security is complete.

The app currently generates local, editable email templates. It does not call an AI API, access Gmail or Outlook, send messages automatically, detect replies, or prove that a follow-up caused a sale. No API keys or OAuth secrets belong in the public GitHub Pages repository.

## Secure production architecture (not yet deployed)
- Backend API hosted separately from GitHub Pages; all AI calls and email-provider tokens are handled server-side.
- Verified user accounts, strong sessions in Secure, HttpOnly, SameSite cookies, multi-factor authentication, tenant isolation, and server-side authorisation for every quote/customer.
- PostgreSQL with tenant-scoped queries and encrypted storage; encrypted, access-controlled backups; data retention and deletion policies.
- Gmail/Outlook OAuth with minimum required scopes, encrypted refresh tokens, verified callback URLs and CSRF/state protections; revocation and reconnect controls.
- Queue-based email sending with explicit opt-in, rate limits, idempotency, suppression lists, reply detection, unsubscribe/opt-out handling and audit logs. Never send without account-holder authorisation.
- AI generation with server-side API keys, prompt-injection precautions for imported email text, privacy/data-processing agreements, bounded output and human approval before first send.
- UK GDPR/PECR compliance review, privacy notice, lawful basis, processor agreements, data-subject deletion/export, incident response and a tested security review before real customers.

## Revenue reporting
'Wins following recorded follow-ups' is an association, not causal attribution. Never present it as guaranteed recovered revenue.

## Next implementation dependency
Choose a hosting/database provider, an identity provider, an AI provider, and Google/Microsoft developer credentials. Production integrations cannot be securely activated from a public static website alone.
