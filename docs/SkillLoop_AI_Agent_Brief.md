# SkillLoop — AI Coding Agent Context

Gunakan file ini sebagai konteks ringkas ketika meminta AI coding agent mengerjakan repository SkillLoop. Untuk seluruh detail, gunakan `PRD_SkillLoop.md` sebagai sumber acuan utama.

## Product summary

SkillLoop adalah responsive web application untuk **reciprocal skill exchange**. Pengguna menambahkan skill yang dapat mereka ajarkan (`TEACH`) dan skill yang ingin mereka pelajari (`LEARN`). Sistem menemukan dua pengguna ketika A dapat mengajarkan sesuatu yang ingin dipelajari B, dan B juga dapat mengajarkan sesuatu yang ingin dipelajari A. Setelah itu mereka dapat mengirim/menyetujui collaboration request dan menjadwalkan learning session.

Produk ini bukan marketplace kursus, bukan mentor directory satu arah, bukan dating app, dan bukan social network umum. Pembeda inti adalah pertukaran skill dua arah yang dijelaskan secara transparan.

## Product statement

> SkillLoop helps people exchange knowledge by matching what each person can teach with what the other person wants to learn, then helps them start a structured learning collaboration.

Tagline kerja: **Learn something. Teach something. Grow together.**

## Baseline tech stack

- Frontend: React + Vite + TypeScript + Tailwind CSS.
- Backend: Node.js + Express + TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- Auth: secure server-side session with HttpOnly cookie; do not store sensitive tokens in localStorage.
- Local development: Docker Compose for PostgreSQL; containerize app services incrementally only when useful.
- Testing: Vitest / Supertest / Playwright as appropriate.

Use currently supported stable package versions that are compatible with the existing repository. Inspect the repository before changing its structure.

## MVP scope — must implement

1. Registration, login, logout, and protected routes.
2. User profile: display name, short bio, preferred languages, timezone, optional avatar.
3. Skill catalog with canonical skill IDs, categories, and curated aliases.
4. User skill declarations with role `TEACH` or `LEARN` and self-assessed levels.
5. Reciprocal matching: both directions must match.
6. Match explanations showing exactly which skills each side can teach the other.
7. Match discovery and basic filters.
8. Collaboration requests: pending, accepted, rejected, cancelled.
9. Learning-session proposal and confirmation with timezone-safe date/time handling.
10. Dashboard and in-app notifications.
11. Block and report controls.
12. Responsive UI plus loading, empty, error, and success states.

## Explicitly out of MVP scope unless product owner approves

- Payments or paid courses.
- Realtime chat, video calling, file sharing.
- AI/LLM-based matching or chatbot.
- Group learning or multi-person matching.
- Native mobile app.
- Complex public reputation/leaderboard system.

## Critical matching rule

A and B are a reciprocal match only if:

- At least one skill in A's `TEACH` list matches a skill in B's `LEARN` list; AND
- At least one skill in B's `TEACH` list matches a skill in A's `LEARN` list.

Use canonical skill IDs or curated aliases. Do not infer semantic equivalence from free text in MVP. Exclude inactive accounts and mutually blocked pairs. Do not label one-way matches as reciprocal matches.

For scoring, the PRD baseline is:

`DirectionScore = 0.70 * SkillFit + 0.20 * LevelFit + 0.10 * AvailabilityFit`

`OverallScore = 0.65 * min(AtoB, BtoA) + 0.35 * average(AtoB, BtoA)`

If availability is not implemented, use a clearly documented neutral treatment or omit that component for algorithm version 1. Never fabricate availability data. Explain matches in plain language; a score is not a probability of success.

## Key entities

- User
- SkillCategory
- Skill
- SkillAlias
- UserSkill (`role`: TEACH / LEARN; proficiency or target level)
- UserLanguage
- AvailabilitySlot (optional later phase)
- CollaborationRequest
- LearningSession
- Notification
- UserBlock
- UserReport
- SessionFeedback (later phase)

Use UUID primary keys, relational constraints, migrations, indexes, and transactions where state changes need atomicity. Consult the full PRD for fields and relationships.

## API conventions

- Prefix `/api/v1`.
- Use REST endpoints and consistent JSON response/error formats.
- Validate request body, query, and path parameters server-side.
- Derive user identity from the authenticated session; never trust client-supplied owner IDs.
- Enforce authorization on every private resource.
- Paginate lists and cap page sizes.
- Do not expose password hashes, secrets, or internal stack traces.

## Security and privacy baseline

- Hash passwords with Argon2id or bcrypt.
- Use HttpOnly cookies; Secure in production; configure SameSite and CSRF protection as appropriate.
- Apply rate limiting to authentication and sensitive endpoints.
- Validate inputs and escape user-generated content when rendered.
- Keep secrets in environment variables or secret manager; never commit `.env`.
- Do not expose email, phone, precise location, password hash, or session secrets to other users.
- Implement block/report; prevent blocked users from finding or requesting each other.
- Do not require users to share personal contact details to use core features.

## Engineering rules

1. Read the full PRD before major implementation work.
2. Inspect the existing repo and preserve working patterns unless there is a clear reason to change them.
3. Work in small, reviewable milestones; do not scaffold the entire app in one uncontrolled change.
4. Use strict TypeScript types; avoid `any` without a documented reason.
5. Separate HTTP routes/controllers from business logic and validation in a proportionate way.
6. Add database migrations for schema changes.
7. Add tests for matching, request state transitions, ownership, and session scheduling.
8. Implement frontend and backend validation; server validation is authoritative.
9. Include loading, empty, error, and success states.
10. Run lint, typecheck, tests, and build after each meaningful milestone.
11. Update README and `.env.example` when setup changes.
12. Never introduce out-of-scope features without asking.

## First implementation sequence

1. Inspect repository and report current structure/tooling.
2. Propose or confirm folder structure and package manager.
3. Set up frontend/backend TypeScript projects and PostgreSQL via Docker Compose.
4. Define Prisma schema and initial migration.
5. Implement authentication and user profile.
6. Implement skill catalog and user skill declarations.
7. Implement reciprocal matching and unit tests.
8. Implement match discovery/explanations.
9. Implement collaboration request lifecycle.
10. Implement session scheduling, dashboard, and notifications.
11. Implement block/report, end-to-end testing, responsive polish, and deployment readiness.

## Required completion report after each task

After making changes, report:

- What was implemented.
- Files created/changed.
- Database migrations added.
- Commands run (lint/typecheck/test/build).
- Test/build outcomes.
- Known limitations or unresolved decisions.
- The next smallest logical task.

Do not claim tests passed unless they were actually run. Do not silently alter product requirements; explain trade-offs and request approval for material scope changes.
