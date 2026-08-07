# Manuscript Vault Security Boundary

The public author website and the private Manuscript Vault are intentionally separate systems.

## Public repository rule

This repository may contain only public website code and public promotional assets. It must not contain manuscript files, manuscript text, private continuity records, unpublished portrait archives, Vault exports, owner credentials, access tokens, private version history, or private download links.

## System of record

Until a separately authenticated private replacement has been audited and approved, the existing Manuscript Vault remains the system of record for:

- manuscript originals and current versions;
- Master Archive designations;
- manuscript version history;
- SHA-256 integrity fingerprints;
- private character portraits and appearance records;
- High Pass continuity records and book-by-book notes;
- security/activity history;
- owner-only manuscript downloads.

The public site must not duplicate these records merely for convenience.

## Migration policy

1. Preserve the existing Vault in place before changing storage or authentication.
2. Export or back up private data only into private storage, never into this public GitHub repository.
3. Preserve stable record IDs, titles, timestamps, version labels, current/Master Archive status, integrity hashes, portrait associations, and continuity associations during any future migration.
4. Resolve duplicate associations without deleting an underlying manuscript until its ownership and backup have been verified.
5. Require server-side authentication for any future owner portal. Client-side hiding is not access control.
6. Manuscript download URLs must be short-lived and non-indexable.
7. Public navigation, sitemap.xml, robots-visible pages, and social metadata must never advertise a private Vault route.
8. Do not put Vault secrets in browser JavaScript or repository files. Use deployment secrets/environment variables in the private application only.

## Current duplicate cleanup rule

The duplicate association involving `KDP_PRINT_BOOK_PUBLISHER_INTERIOR (21).docx` should be detached from *The Lady Beneath Midnight* while preserving it for *The House That Kept the Last Lamp*. The separate `KDP_PRINT_BOOK_PUBLISHER_INTERIOR (6).docx` remains the current Lady manuscript unless the private Vault records establish otherwise.

## Future owner entry point

A future `rkeithparkerbooks.com` owner entry point may redirect an authenticated owner to the private Vault, but the public Vercel site must not host manuscript files. Authentication and authorization must be enforced by the private service before any Vault content or download is returned.
