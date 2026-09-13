# Orb development

`.agents/setup` installs locked dependencies and OpenCode V1 1.18.30 in
`.amp/tooling`, then warms the public embedding model used by the journal.
It does not start a server, authenticate providers, or seed personal data.
`.agents/resume` intentionally performs no work.

Start the headless development server with `amp orb services ensure`.
Inspect it with `amp orb service status opencode` and
`amp orb service logs opencode`. Restart after source or configuration changes
with `amp orb service restart opencode`; stop with `amp orb service stop opencode`.
The service is loopback-only and has no public portal. Do not expose its API
without configuring runtime authentication: it can access files and execute tools.

`.agents/opencode` runs the pinned CLI with an isolated HOME and XDG directories
under `.amp/runtime/v1/home`, using `.amp/runtime/v1/project` as its project.
The launcher loads this checkout's plugin and initially enables the journal.
Edit `.amp/runtime/v1/home/.config/opencode/agent-memory.json` and restart to test
with the journal disabled. Existing configuration is preserved on subsequent runs.
Use `.agents/opencode --help` for other commands. Provider credentials, if needed
for a deliberate live-model test, belong only in runtime configuration/secrets.
Never authenticate during setup or run paid prompts from setup/resume.

Runtime files are gitignored, not excluded from orb snapshots. Do not run the
development launcher from setup: only tools, dependencies, and public model assets
should enter a reusable setup snapshot. Existing orb pause snapshots retain runtime
state normally.

Verification:

```sh
bun run typecheck
# Isolate the unit tests too: memory tests write to the process home.
test_home=$(mktemp -d)
HOME="$test_home" bun test
rm -rf -- "$test_home"
bun .agents/check-embeddings.ts --offline
bun .agents/check-plugin.ts
```

Server health does not prove plugin loading. Inspect `/experimental/tool/ids` and
`/experimental/tool?provider=...&model=...` for memory and journal tools; executing
session prompts is a separate integration check. Unit tests mock embeddings, so
the offline check above is necessary to verify real inference and cache reuse.

V2 is not installed or supported by this setup. Its plugin API requires a separate
compatibility effort. If comparing V2 later, pin the intended distribution in a
separate prefix with its own runtime HOME/project: current V2 distributions may
also expose an `opencode` binary and must not overwrite the V1 command.
