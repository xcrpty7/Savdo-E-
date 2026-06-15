Security audit summary — Savdo-E

Date: 2026-06-12

Actions performed:
- Checked repository for tracked env files. backend/.env is present locally but not tracked by git (already ignored).
- Added/removal: no git-index changes required; backend/.env already listed in .gitignore.
- Ran npm audit in backend, web, mobile and npm outdated checks.
- Performed a production build for web (Vite) — build succeeded.
- Created remediation todos in session tracker.

Top findings (high-level):
- Backend: 6 moderate vulnerabilities (notable: @anthropic-ai/sdk, express -> fixable by updating to latest non-vulnerable versions).
- Web: 7 vulnerabilities (2 high: axios-related; moderate: vite, postcss) — update axios and vite.
- Mobile: 12 moderate vulnerabilities in expo-related packages — update expo SDK where possible.

Immediate recommended actions (ordered):
1. Rotate all secrets that could have been exposed (DB credentials, JWT secrets, ADMIN_SETUP_KEY, Google/SMS keys). Revoke old keys at provider dashboards.
2. Move environment variables to the hosting provider's secret store (Vercel/Railway/Render). Do NOT commit .env files.
3. Update dependencies with known fixes (examples below) and run full test suite after each major bump:
   - backend: bump @anthropic-ai/sdk -> 0.104.1, joi -> 18.2.1, express -> latest minor, prisma -> latest advised
   - web: bump axios to >=1.17.0, vite -> 8.x, postcss -> >=8.5.15
   - mobile: upgrade expo SDK to 56.x series where applicable
4. Add CI checks: `npm audit`, `npm audit --production`, secret-scan (e.g., GitHub Actions with truffleHog/secret-scanner), and dependency update PRs.
5. Hardening: restrict CORS to production domains, enable HSTS/HTTPS, ensure secure cookie flags, configure DB user with minimal privileges and IP restrictions.

Notes & next steps:
- I did NOT rewrite git history or force-push. If secrets were historically committed, prepare a coordinated plan (team communication, rotate creds, use BFG or git-filter-repo and force-push) before performing the purge.
- I can proceed to: (A) run controlled dependency upgrades and create PRs, (B) run git-history purge (with explicit confirmation), (C) prepare CI workflow files for secret scanning and audits.

Remediation todos were inserted in the session tracker.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
