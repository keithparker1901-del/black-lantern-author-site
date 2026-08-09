# R. Keith Parker Author Site

A responsive, static author website prepared for Vercel deployment.

## Included professional corrections

- Book Three has no Amazon purchase or review links.
- Book Three navigation contains only real sections.
- Leah Hogue is used consistently.
- The public Chronicle Library contains no cover grades, rankings, internal evaluations, or author-only download instructions.
- No unfinished Goodreads-verification placeholder is displayed.
- The public contact address is `keith@rkeithparkerbooks.com` throughout.

## Deployment sequence

1. Import this repository into Vercel.
2. Deploy as a preview first.
3. Verify all pages, links, mobile layout, and email actions.
4. Migrate the current mailing-list and visitor-counter functionality before moving the custom domain.
5. Attach `rkeithparkerbooks.com` only after preview approval.

## Analytics

The production project is connected to the private `lantern-road-analytics` Vercel Blob store. Pageview and outbound-click events are written by the server-side analytics endpoints, and the private owner dashboard reads from that durable store.

## Important

The Amazon links for the two published Black Lantern books currently use Amazon search URLs. Replace them with the exact product URLs when verified.

## Migrated production assets

The original public book covers, maps, character portraits, author photograph, brand symbol, social card, and verified public purchase/profile links are now source controlled in this repository. Private mailing credentials and subscriber data remain outside GitHub.
