# claude

Claude Code configuration repository.

## Installed skills

The **UI/UX Pro Max** skill bundle is vendored into `.claude/skills/`. Any Claude Code
session opened on this repository loads all seven skills automatically — no plugin
marketplace step required.

| Skill | What it does |
|---|---|
| `ui-ux-pro-max` | Core design intelligence. Searchable local database: 79 styles (50 active), 192 product palettes + reasoning profiles, 74 font pairings, 119 UX guidelines, 105 icons, 17 GSAP presets, 25 chart types, 22 tech stacks. |
| `design` | Umbrella design skill: brand identity, logo generation (55 styles), corporate identity program, HTML presentations, banners, icons, social images. |
| `design-system` | Three-layer token architecture (primitive → semantic → component), CSS variables, spacing/type scales, component specs. |
| `ui-styling` | shadcn/ui + Radix + Tailwind implementation, responsive layout, dark mode, accessible components, canvas visuals. |
| `brand` | Brand voice, messaging frameworks, asset management, style guides, brand-compliance review. |
| `banner-design` | Banners for social, ads, web heroes, and print across 13 styles and 8 platforms. |
| `slides` | Strategic HTML presentations with Chart.js and design tokens. |

### Using it

The skills activate on their own when you ask for UI or design work. To query the
database directly:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "saas landing page" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech dashboard" --stack nextjs --design-system
```

`search.py --help` lists all domains and stacks.

### Optional API keys

Most of the bundle is offline — local CSV/JSON data and Python search, no network
calls. Only the AI **image-generation** paths reach out, and only if you set the
matching key: `GEMINI_API_KEY`, `ATLASCLOUD_API_KEY`, or `MUAPI_API_KEY` (logo, icon,
and CIP mockup generation). Stock photo lookup uses Pexels. Everything else works
with no keys set.

### Provenance

Vendored from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
v2.13.0, MIT licensed — see `.claude/skills/LICENSE-ui-ux-pro-max`.

Upstream also publishes the bundle as a plugin, which installs it for your account
rather than per-repo:

```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

To update the vendored copy, re-clone upstream and replace `.claude/skills/`.


## ADHD Life OS — deploying

Build, then upload `dist/` into `public_html/`.

```bash
npm install
npm run build          # production: the licence gate calls /api/validate.php
npm run build:preview  # demo build with no server behind it; gate is a shape check only
npm test               # six suites
```

### Licence validation (required before selling)

The app is static and cannot hold a secret, so one small PHP endpoint holds the
Whop API key and proxies the check. It ships in `dist/api/`.

1. Upload `dist/` to `public_html/`.
2. Copy `api/config.example.php` to `api/config.php` on the server.
3. Put your Whop API key in it (Whop dashboard → Developer → API keys).

`config.php` is gitignored and blocked by `api/.htaccess`, so the key never
reaches the repository and is never served.

Without `config.php` the endpoint answers 503, which the app reports as "the
check couldn't run" with a retry — it never rejects anyone. That is deliberate:
a paying customer must not be locked out by a misconfigured deploy. It also
means **the gate is open until you add the key**, so do step 3 before launch.

The endpoint calls `POST https://api.whop.com/api/v2/memberships/{key}/validate_license`
with empty metadata. Whop uses metadata to bind a licence to a device; the spec
rules device binding out, so there is nothing to mismatch. Verify that path
against Whop's current API reference before launch — their v2 docs have moved.
