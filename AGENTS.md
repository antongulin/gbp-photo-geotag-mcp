# AGENTS.md

Canonical repository instructions. The closest `AGENTS.md` to the files you are changing wins.

## DOX framework

This repository follows the DOX AGENTS.md-hierarchy framework, integrated from
[`agent0ai/dox`](https://github.com/agent0ai/dox) at revision `765ae4ac02cc884eefcd41a3d0f71941721adb89`.
DOX's own `AGENTS.md` is the upstream reference; this file applies it to this repository.

### Core contract

- Every `AGENTS.md` is a binding work contract for the subtree it governs.
- Work products, source materials, instructions, records, assets, and durable docs must stay
  understandable from the nearest applicable `AGENTS.md` plus every parent `AGENTS.md` above it.

### Read before editing

1. Read this root `AGENTS.md`.
2. Identify every file or folder you expect to touch.
3. Walk from the repository root to each target path and read every `AGENTS.md` along the route.
4. Use the nearest `AGENTS.md` as the local contract and parent docs for repo-wide rules.
5. If docs conflict, the closer doc controls local details, but no child doc may weaken DOX.
6. Do not rely on memory. Re-read the applicable chain in the current session before editing.

### Update after editing

Every meaningful change requires a DOX pass before the task is done. Update the closest owning
`AGENTS.md` when a change affects purpose, scope, ownership, durable structure, contracts,
workflows, operating rules, required inputs/outputs/permissions/constraints/side effects/artifacts,
or the child index. Update parents when parent-level structure or the child index changes; update
children when parent changes alter local rules. Remove stale or contradictory text immediately.

### Hierarchy

- Root `AGENTS.md` is the rail: project-wide instructions, durable workflow rules, and the Child
  DOX Index.
- Child `AGENTS.md` files (when a folder becomes a durable boundary) own domain-specific
  instructions and their own Child DOX Index.
- The closer a doc is to the work, the more specific and practical it must be.

### Child doc shape

Default section order: Purpose, Ownership, Local Contracts, Work Guidance, Verification, Child DOX
Index. Leave Work Guidance empty when the project has no specific standards; leave Verification
empty until a check exists.

### Closeout

Re-check changed paths against the chain, update the nearest owning docs and affected parents or
children, refresh every affected Child DOX Index, remove stale text, run existing verification when
relevant, and report any docs intentionally left unchanged and why.

## Repository overview

MCP server that adds GPS coordinates and location metadata to photos for Google Business Profile
SEO. TypeScript throughout.

- `src/` — MCP server and tools (`src/index.ts`, `src/client-server.ts`, `src/tools/`, `src/services/`, `src/trigger/`, `src/types.ts`).
- `remote-mcp/` — separately packaged Netlify remote/web API (`remote-mcp/netlify/functions/*.mts`, `remote-mcp/public/index.html`).
- `examples/` — sample inputs and docs.
- `.github/workflows/` — CI/review automation. Treat workflow and deployment config as production-sensitive; inspect triggers before changing.

## Git and delivery

Start every session by inspecting Git status and worktrees, fetching `origin` with pruning, safely fast-forwarding local `main`, and verifying `main` matches `origin/main`. Only then create a task branch from synchronized `main` if needed. Preserve existing task branches and unfinished work. Never reset, discard changes, auto-stash, or force-push merely to synchronize. If safe synchronization is blocked, resolve the blocker before editing or branching.

Follow the repository's required pull-request and review process. Treat deployment and infrastructure configuration as production-sensitive; inspect workflow triggers before publication. Do not expose API keys or other credentials.

## Code intelligence: CodeGraph

- **CodeGraph** is the approved code-intelligence index for the TypeScript sources (`src/`, and the
  TypeScript in `remote-mcp/`). Project-local MCP configs are committed for the Claude-compatible
  [`.mcp.json`](.mcp.json), Codex [`.codex/config.toml`](.codex/config.toml), OpenCode
  [`opencode.jsonc`](opencode.jsonc), Cursor [`.cursor/mcp.json`](.cursor/mcp.json), and VS Code
  [`.vscode/mcp.json`](.vscode/mcp.json). Each launches `codegraph serve --mcp`, sets
  `CODEGRAPH_TELEMETRY=0`, and passes `--path ${workspaceFolder}` for clients that support a
  workspace placeholder.
- **Start clients from this checkout.** Clients without a workspace placeholder (`.mcp.json`,
  `.codex/config.toml`, `opencode.jsonc`) rely on the client's project root/`rootUri`; confirm
  `codegraph status` reports this project. A CLI run from a parent directory targets that parent.
- **Telemetry is off** via the committed `CODEGRAPH_TELEMETRY=0`. Keep it off.
- **The index stays untracked.** `.codegraph/` is gitignored and must never be committed. Build it
  once per checkout, then check it:

  ```bash
  CODEGRAPH_TELEMETRY=0 codegraph init .
  CODEGRAPH_TELEMETRY=0 codegraph sync .   # after pulls/merges that add files
  CODEGRAPH_TELEMETRY=0 codegraph status   # confirm "Index is up to date"
  ```

- **Use CodeGraph for indexed code.** It gives symbol navigation for the TypeScript sources. For
  Markdown (`README.md`, `CHANGELOG.md`, `examples/*.md`) and files reported without real symbols,
  treat it as a file lister rather than navigation and use ordinary search and read.
- **Canonical source:** `https://github.com/colbymchenry/codegraph`. The global `codegraph` binary
  is a user-managed, pre-existing install (ask before adding or updating); per-repo setup here is
  only the wiring plus the local index.
- **Commands:** `codegraph status`, `codegraph query "<symbol>"`, `codegraph node <file-or-symbol>`,
  `codegraph explore "<area>"`, `codegraph files`.

## Boundaries

### Always

- Keep `AGENTS.md` the only canonical repository instruction file.
- Use atomic conventional commits.
- Keep the MCP product setup and secret placeholders in `README.md` separate from developer
  navigation.

### Ask first

- Add dependencies, change CI/visibility, or install tooling.
- Add or update the global `codegraph` binary.

### Never

- Commit `.codegraph/` (local, gitignored index state) or credentials/secrets.
- Add a competing root instruction file (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, or similar) or
  edit home-directory configs from this repository.

## Child DOX Index

This index is intentionally empty. This repository has no child `AGENTS.md` files yet; scan the
subtree before assuming otherwise. Add a child `AGENTS.md` when a folder becomes a durable boundary
with its own purpose, rules, responsibilities, workflow, materials, or quality standards, then list
it here.
