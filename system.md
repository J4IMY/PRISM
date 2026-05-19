
Enterprise Software Discovery & Comparison Platform
Technical Specification v1.0

Document owner: Engineering / Product
Status: Draft for sprint planning
Platforms: React Native (iOS/Android) + React (Web)
Backend: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
1. Executive Summary

A multi-tenant B2B SaaS platform for discovering, comparing, and evaluating enterprise software systems. The product serves four distinct audiences through two clients:

    Mobile app (React Native): End Users — discovery, watchlists, TCO, vendor contact.
    Web app (React): End Users + Vendors + Moderators + Admins — everything mobile does, plus management dashboards and data governance.

A backend web scraper ingests candidate system data into a moderation queue; moderators and admins clean and publish it. Vendors can claim/own their systems and self-manage pricing, features, media, and team chat with prospects.
2. User Roles & Authorization Matrix
Capability 	End User 	Vendor 	Vendor Member 	Moderator 	Admin
Browse/search systems 	✅ 	✅ 	✅ 	✅ 	✅
Watchlist + TCO compare 	✅ 	✅ 	✅ 	✅ 	✅
Message a vendor 	✅ 	— 	— 	— 	—
Request account/data deletion 	✅ 	✅ 	✅ 	— 	—
Edit vendor company profile 	— 	✅ (owner) 	✅ (if perm) 	— 	✅
CRUD systems / pricing / features / media 	— 	✅ 	✅ (if perm) 	— 	✅
Invite/remove vendor team members 	— 	✅ (owner) 	— 	— 	✅
Chat with inbound prospects 	— 	✅ 	✅ 	— 	✅
Contact admins 	— 	✅ 	✅ (if perm) 	✅ 	n/a
Review scraper queue 	— 	— 	— 	✅ 	✅
Publish/reject scraped data 	— 	— 	— 	✅ 	✅
Process data-deletion requests 	— 	— 	— 	— 	✅
Manage moderators 	— 	— 	— 	— 	✅
Respond to vendor inquiries 	— 	— 	— 	— 	✅

Roles are stored in a dedicated user_roles table (never on profiles) and checked via a SECURITY DEFINER function has_role(uid, role) to avoid RLS recursion. Vendor membership and per-member permissions live in vendor_members (separate from global roles).

Mobile app exposure: End User role only. A vendor/admin/moderator who logs in on mobile sees the end-user experience plus a banner: "Manage your vendor account on the web."
3. Information Architecture
3.1 Mobile (React Native) — 8 surfaces

    Login — email/password, Google OAuth, "Forgot password".
    Sign Up — email/password + email verification.
    Home — searchable, filterable system list (infinite scroll).
    System Detail — overview, pricing, features, TCO calculator, gallery, vendor links, "Message vendor".
    Watchlist — saved systems, multi-system TCO and side-by-side compare.
    Settings — theme, push notification prefs.
    Profile — email, username, password change, privacy, "Request data deletion".
    Vendor login redirect notice — same auth; if role ≠ end_user, show informational screen linking to web.

3.2 Web (React) — All of the above PLUS

    Vendor Dashboard — company profile, system catalog CRUD, media, team management, admin inbox.
    Admin Dashboard — scraper queue, deletion-request queue, moderator management, vendor inbox, audit log.
    Moderator Dashboard — scraper queue (assigned), clean/publish/escalate.

3.3 Route map (web)

/                         Home (discovery)
/auth/login | /signup | /forgot | /reset
/systems/:slug            System Detail
/watchlist
/compare?ids=...
/settings  /profile
/vendor                   Vendor dashboard (layout)
  /vendor/company
  /vendor/systems         list
  /vendor/systems/:id     edit (pricing, features, media)
  /vendor/team
  /vendor/inbox           threads with admins + prospects
/admin                    Admin dashboard (layout)
  /admin/scraper
  /admin/deletions
  /admin/moderators
  /admin/vendors
  /admin/audit
/moderator
  /moderator/queue
  /moderator/item/:id

4. Page-by-Page Functional Spec
4.1 Login (Mobile + Web)

    Inputs: email, password. Buttons: "Sign in", "Continue with Google", "Forgot password".
    Supabase Auth with signInWithPassword and signInWithOAuth({provider:'google'}).
    On success: fetch role; route end users → Home; vendors/admins/mods on web → respective dashboard; on mobile → Home with banner.
    Validation: email format, password ≥ 8 chars; rate-limit failed attempts (5/15 min via edge function + Supabase auth.rate_limit).

4.2 Sign Up (Mobile + Web)

    Email + password + confirm; send verification email (emailRedirectTo).
    Block login until email_confirmed_at set.
    A handle_new_user() trigger inserts a profiles row and a default user_roles row (end_user).

4.3 Password Recovery

    resetPasswordForEmail(email, { redirectTo: '<host>/auth/reset' }).
    Dedicated /auth/reset page detects type=recovery and calls updateUser({ password }). Mobile deep-link appscheme://reset.

4.4 Home / Discovery

    Server-paginated grid/list. Default sort: relevance, then rating.
    Filters: category (multi), pricing tier (Free / $ / $$ / $$$), deployment (cloud/on-prem/hybrid), company size fit (SMB/Mid/Enterprise), features (multi), integrations, region, compliance (SOC2, ISO27001, HIPAA, GDPR), free-trial flag, vendor verified flag.
    Search: PostgreSQL full-text (tsvector on name + tagline + description + features). Trigram fallback for typos.
    Card: logo, name, vendor, tagline, starting price, badges (verified, free trial), watchlist toggle.

4.5 System Detail

Sections in order:

    Header (logo, name, vendor link, verified badge, "Add to watchlist", "Message vendor").
    Overview/description (rich text, markdown rendered).
    Screenshots gallery (lightbox; lazy-loaded; CDN via Supabase Storage).
    Pricing packages (cards: name, base price, billing cadence, included seats, feature highlights).
    Feature matrix (grouped by category, ✓/—/value).
    TCO Calculator (see §5).
    Vendor links: website, video (YouTube/Vimeo embed), LinkedIn, X, others.
    Reviews/rating placeholder (out of scope v1, schema reserved).
    "Message vendor" CTA → opens thread.

4.6 Watchlist & Compare

    Watchlist screen: list of saved systems with quick remove and per-system TCO summary using last-used inputs.
    Compare view: up to 4 systems side-by-side. Aligned rows: pricing tier chosen, monthly cost, 1yr/3yr TCO, included features, integrations, compliance. Differences highlighted.
    Shareable compare URL (web): /compare?ids=a,b,c&inputs=<base64>.

4.7 Settings

    Theme: system/light/dark (persisted in profiles.preferences).
    Notifications: email digest cadence, push toggles (new vendor reply, price change on watchlist, weekly digest).
    Mobile: also language (i18n stub), biometric unlock toggle.

4.8 Profile

    Update email (re-verification), username, password (requires current password).
    Privacy: data export (JSON), Request data deletion (creates deletion_requests row, status pending).

4.9 Vendor Dashboard (Web only)

    Company: name, logo, description, website, socials, HQ, size, founded, verified badge (admin-granted).
    Systems list: table with status (draft/published/archived), last edit, owner.
    System editor (tabs): Overview · Pricing packages · Features · Media · Links · SEO.
        Pricing package editor supports models: flat, per-seat, per-usage (define unit + unit price + included), tiered (volume breakpoints), one-time, hybrid (base + per-seat + usage). Each package: name, billing cadence (monthly/annual/custom), currency, min commitment, setup fee, included features (link to feature rows), optional add-ons.
        Media: drag-drop to Supabase Storage bucket system-media/{system_id}/...; auto thumbnails via edge function.
    Team:
        Owner can invite by email; invitee receives signed link; on signup/login they're added to vendor_members with role (owner | member) and JSON permission flags (can_edit_systems, can_chat, can_contact_admin, can_manage_team).
        All members chat under the vendor identity; messages stamped with sender_user_id for audit.
    Inbox: unified threads — prospects (from system "Message vendor") and admins. Realtime via Supabase Realtime on messages table.

4.10 Admin Dashboard (Web only)

    Scraper queue: filter by source, confidence, age. Bulk assign to moderators. Open item → side-by-side raw vs cleaned editor, diff view, "Publish" / "Reject" / "Send back to moderator".
    Deletion requests: queue with SLA timers (e.g., 30 days GDPR). Actions: anonymize, hard delete, deny with reason. All actions logged.
    Moderator management: invite, suspend, reassign workloads, view throughput metrics.
    Vendor inbox: threads from vendors; assignable to staff; canned replies.
    Audit log: immutable view of privileged actions.

4.11 Moderator Dashboard (Web only)

    Personal queue of assigned scraped items.
    Editor with field-level validation, duplicate detection (suggest merge with existing system), publish (state machine: scraped → in_review → ready → published or rejected), escalate (assigns to admin with note).

5. TCO Calculator

Inputs (user-facing): number of seats, expected usage (per-unit metrics specific to the package, e.g., GB, API calls), term length (1/3/5 yr), implementation cost override, training/internal cost override, expected annual price escalation %, discount %.

Computation per package:

year_cost(y) = base_fee_y
             + seats * per_seat_price_y
             + Σ usage_metric_i * unit_price_i_y
             + amortized(setup_fee + implementation + training, term)
             - discounts
price_y = price_(y-1) * (1 + escalation)
TCO = Σ year_cost(y) for y in 1..term

Pure function in a shared TS package (@app/tco) consumed by both mobile and web so results are identical. Calculator is stateless in v1 — inputs persist locally; "Save scenario" optional v1.1.

Compare mode reuses the same engine and renders a normalized table.
6. Data Model (PostgreSQL / Supabase)

Schemas: public for app, private for service-role-only.

profiles(id uuid pk → auth.users, username citext unique, avatar_url, preferences jsonb, created_at)

app_role enum ('end_user','vendor','moderator','admin')
user_roles(id, user_id → auth.users, role app_role, unique(user_id,role))

vendor_companies(id, name, slug unique, logo_url, description, website,
                 socials jsonb, hq_country, size, founded, verified bool,
                 created_by, created_at, updated_at)

vendor_members(id, vendor_id → vendor_companies, user_id → auth.users,
               member_role text check in ('owner','member'),
               permissions jsonb, invited_by, joined_at,
               unique(vendor_id,user_id))

vendor_invites(id, vendor_id, email citext, token uuid, permissions jsonb,
               expires_at, accepted_at)

categories(id, name, slug, parent_id)

systems(id, vendor_id → vendor_companies, name, slug unique, tagline,
        description_md, status text ('draft','published','archived'),
        primary_category_id → categories,
        search_tsv tsvector,
        compliance text[], deployment text[], company_size text[],
        created_at, updated_at, published_at)

system_categories(system_id, category_id, pk(system_id,category_id))

features(id, system_id, group_name, name, value text, sort_index)

pricing_packages(id, system_id, name, model text
                 check in ('flat','per_seat','per_usage','tiered','one_time','hybrid'),
                 billing_cadence text, currency text, base_price numeric,
                 per_seat_price numeric, setup_fee numeric, min_seats int,
                 min_commitment_months int, included jsonb, sort_index)

pricing_usage_metrics(id, package_id → pricing_packages, metric_key, unit,
                      included_quantity numeric, unit_price numeric,
                      tier_breakpoints jsonb)

system_media(id, system_id, kind text ('screenshot','logo','video'),
             storage_path, caption, sort_index)

system_links(id, system_id, kind text ('website','linkedin','x','youtube','demo','other'), url)

watchlists(id, user_id, system_id, notes, created_at, unique(user_id,system_id))

message_threads(id, kind text ('vendor_prospect','vendor_admin'),
                vendor_id, system_id null, opened_by_user_id,
                assigned_to_user_id null, status text, last_message_at)

messages(id, thread_id, sender_user_id, sender_role, body, attachments jsonb,
         created_at, read_at)

deletion_requests(id, user_id, reason, status text
                  ('pending','in_review','approved','denied','completed'),
                  requested_at, resolved_at, resolved_by, notes)

scraper_items(id, source, source_url, raw jsonb, normalized jsonb,
              confidence numeric, status text
              ('scraped','assigned','in_review','ready','published','rejected'),
              assigned_to_user_id null, system_id null (post-publish),
              created_at, updated_at)

audit_log(id, actor_user_id, action, entity, entity_id, diff jsonb, created_at)

notifications(id, user_id, kind, payload jsonb, read_at, created_at)

Key indexes: GIN on systems.search_tsv; btree on messages(thread_id, created_at); partial index on scraper_items(status) where status in ('scraped','assigned','in_review').
6.1 RLS Highlights

    systems: read where status='published' for all; full access if EXISTS vendor_members for vendor_id or has_role(uid,'admin').
    vendor_companies, pricing_packages, features, system_media, system_links: write requires vendor_members.can_edit_systems or admin.
    messages: read/write requires participation in thread (sender, vendor member of thread.vendor_id, or admin assignee).
    deletion_requests: insert by self; read self or admin; update admin only.
    scraper_items: select/update requires moderator (own assignments) or admin.
    user_roles: select self or admin; insert/update admin only.

7. API Surface (Supabase + Edge Functions)

Most CRUD is direct PostgREST under RLS. Edge Functions cover privileged or composite operations:
Function 	Method 	Purpose 	Auth
auth-post-signup 	trigger 	create profile + default role 	service
invite-vendor-member 	POST 	create invite + email 	vendor owner
accept-vendor-invite 	POST 	validate token, attach user 	authed
submit-deletion-request 	POST 	rate-limited create 	end user
process-deletion 	POST 	anonymize/hard-delete 	admin
publish-scraper-item 	POST 	upsert into systems+children atomically 	moderator/admin
vendor-thread-create 	POST 	open thread from System Detail 	end user
notifications-fanout 	trigger 	on new message → push/email 	service
media-thumbnail 	storage trigger 	generate thumbs 	service
tco-export 	GET 	server-rendered PDF of scenario (v1.1) 	authed

Realtime channels:

    messages:thread_id=eq.<id> — chat updates.
    scraper_items:status=in.(...) — admin queue refresh.
    notifications:user_id=eq.<uid> — toasts/push.

8. Real-time vs Async Matrix
Interaction 	Mode
Chat messages 	Realtime (Supabase channel)
New message notification (offline) 	Async push (FCM/APNs) + email digest
Scraper queue updates 	Realtime to admin/mod dashboards
Watchlist add/remove 	Optimistic local + REST
Pricing edits → search index 	Async (trigger refreshes tsv)
Deletion processing 	Async (admin worker)
Scraper ingestion 	Async (external worker → scraper_items)
9. Mobile vs Web UX Considerations

Mobile (React Native, Expo recommended):

    Bottom tab nav: Home · Watchlist · Inbox (if vendor) · Profile.
    Pull-to-refresh on Home and Watchlist.
    Native share sheet for system links.
    Push notifications via Expo Notifications → FCM/APNs.
    Biometric unlock (expo-local-authentication) for re-auth on Profile changes.
    Offline cache last-viewed systems (MMKV) for read-only display.
    Image gallery uses native pager with pinch-zoom.
    Forms use native pickers; TCO calculator inputs use numeric keyboards.

Web (React, Vite/TanStack Start):

    Persistent left sidebar for dashboards; top nav for public discovery.
    Keyboard shortcuts in moderator/admin queues (j/k navigate, p publish, r reject).
    Compare view leverages wide viewport for true side-by-side.
    Rich-text editor for system descriptions (TipTap).
    Drag-drop uploads with progress.
    SSR/SEO for /systems/:slug (title, meta, JSON-LD SoftwareApplication).

Shared layer: @app/tco, @app/types (generated from Supabase), @app/validation (Zod), @app/api (typed Supabase client wrappers).
10. Performance

    DB: indexes per §6; covering index on systems(status, published_at desc) for Home.
    Search: precomputed tsv via trigger; pg_trgm index for fuzzy.
    Lists: cursor pagination (avoid OFFSET).
    Media: Supabase Storage + image transform (?width=); responsive srcset on web.
    Caching: TanStack Query everywhere; stale-while-revalidate for Home filters.
    Mobile: FlashList for long lists; image prefetch on Home card visibility.
    Realtime: subscribe only to active thread; tear down on blur.

11. Security & Compliance

    RLS on every public table; default deny.
    Roles separated from profile; has_role() SECURITY DEFINER (see §2).
    Vendor membership checks via SECURITY DEFINER helper to avoid recursive policies.
    All privileged Edge Functions verify JWT and role server-side.
    Audit log written via DB triggers for sensitive tables (vendor_companies, systems, user_roles, deletion_requests, scraper_items publish).
    PII minimization: profile contains only necessary fields; raw scraper PII stripped.
    GDPR: data export endpoint, deletion workflow with 30-day SLA, regional storage if required.
    Auth: enable HIBP password check; enforce email verification; OAuth via Google with verified-domain hint for vendors (optional).
    Rate limits: signup, password reset, message send, deletion requests (edge function token bucket per IP+user).
    Content security: sanitize markdown server-side; signed URLs for private media; virus scan on uploads (edge function hook).
    Multi-tenant isolation: every vendor-owned row carries vendor_id; RLS gates on vendor_members.
    Secrets: stored as Supabase secrets; never in client bundle.

12. Notifications & Messaging

    New thread message → recipient gets in-app toast, push (if mobile token registered), email if unread > 10 min.
    Watchlist price change (detected by trigger on pricing_packages update) → digest email + push.
    Admin assignment → in-app + email.
    Templates centralized in notification_templates (future) — v1 hardcoded.

13. Observability

    Supabase logs + Postgres slow-query log.
    Client error reporting (Sentry) on both apps.
    Product analytics (PostHog) — events: system_viewed, watchlist_add, tco_calculated, vendor_message_sent, scraper_item_published.
    Health dashboards for: scraper backlog depth, deletion request SLA, message latency.

14. Phasing / Sprint-Ready Backlog

Sprint 1 – Foundations

    Supabase project, schema, RLS, roles, auth flows (email + Google), profile trigger.
    Shared packages skeleton (types, tco, api).
    Web shell + Mobile shell with login/signup/forgot/reset.

Sprint 2 – Discovery

    systems schema + seed, Home list + filters + search, System Detail (no TCO), watchlist.

Sprint 3 – TCO + Compare

    @app/tco, calculator UI on System Detail, Compare view, watchlist TCO summary.

Sprint 4 – Vendor Dashboard

    Company + Systems CRUD, pricing/features/media editors, team invites & permissions.

Sprint 5 – Messaging

    Threads + messages tables, realtime, vendor inbox, end-user "Message vendor", push/email fanout.

Sprint 6 – Moderation + Scraper

    scraper_items, moderator queue, publish workflow, admin scraper review, audit log.

Sprint 7 – Admin Ops + Compliance

    Deletion requests workflow, moderator management, vendor inbox for admins, audit log UI, GDPR export.

Sprint 8 – Polish

    Notifications center, settings/theme on mobile, performance pass, SEO, analytics, error reporting, hardening.

15. Open Questions / Decisions Needed

    Reviews & ratings: in v1 or deferred? Schema reserved; UI not specced.
    Vendor verification process: self-serve with domain verification, or manual admin approval only?
    Pricing currencies: single (USD) at launch or multi-currency with FX?
    Mobile vendor features: truly web-only, or read-only inbox on mobile for vendors?
    Scraper source contract: who owns it, what's the payload schema, push or pull?
    i18n: required at launch? Which locales?
    Free trial / paid tiers for end users: is the platform free for end users, freemium, or seat-based for vendors? Billing (Stripe/Paddle) not in this spec.
    SLA for vendor reply — surfaced in UI? auto-escalate?
    Data retention for rejected scraper items and closed deletion requests.
    Moderator → Admin escalation rules — automatic on N rejects, or manual only?
    OAuth providers for vendors: Microsoft / SAML SSO needed for enterprise?
    Custom domains/white-label for vendor profile pages: in scope?

End of specification.
