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
