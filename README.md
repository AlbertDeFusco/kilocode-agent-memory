# kilocode-agent-memory

[Letta](https://letta.com)-style editable [memory blocks](https://docs.letta.com/guides/agents/memory-blocks/) for [Kilo](https://kilo.ai).

## Experimental

This plugin is experimental. The core idea - giving the agent persistent, self-editable memory blocks - is adapted from [Letta](https://github.com/letta-ai/letta). Specifically, the plugin follows Letta's [shared memory blocks](https://docs.letta.com/tutorials/shared-memory-blocks) pattern - the markdown files on disk are shared state that every Kilo session can read and write.

Think of it as AGENTS.md with a harness. Kilo supports custom instruction files via `AGENTS.md` - this plugin is similar in spirit, but adds structure (scoped blocks with metadata and size limits), dedicated tools for memory operations, and prompting that encourages the agent to actively maintain its own memory. The content is similar; the scaffolding around it is what's different.

For background on the memory concept, see Letta's docs on [memory](https://docs.letta.com/guides/agents/memory/) and [memory blocks](https://docs.letta.com/guides/agents/memory-blocks/).

## Features

- **Persistent memory** - Information survives across sessions and context compaction
- **Shared across sessions** - Global blocks shared across all projects, project blocks shared across sessions in that codebase
- **Self-editing** - The agent can read and modify its own memory with dedicated tools
- **System prompt injection** - Memory blocks appear in the system prompt, always in-context
- **Journal** - Append-only entries with semantic search for capturing insights, decisions, and discoveries across sessions

## Requirements

- [Kilo](https://kilo.ai/) v7.7.3 or later

## Installation

Add to your Kilo config (`~/.config/kilo/kilo.json`):

```json
{
  "plugin": ["kilocode-agent-memory"]
}
```

Restart Kilo and you're ready to go.

Optionally, pin to a specific version for stability:

```json
{
  "plugin": ["kilocode-agent-memory@0.2.0"]
}
```

Kilo fetches unpinned plugins from npm on each startup; pinned versions are cached and require a manual version bump to update.

### Local Development

If you want to customize or contribute:

```bash
git clone https://github.com/AlbertDeFusco/kilocode-agent-memory ~/.config/kilo/kilocode-agent-memory
mkdir -p ~/.config/kilo/plugin
ln -sf ~/.config/kilo/kilocode-agent-memory/src/plugin.ts ~/.config/kilo/plugin/memory.ts
```

## Usage

### Memory Tools

The plugin gives the agent 3 tools for managing memory:

| Tool | Description |
|------|-------------|
| `memory_list` | List available memory blocks (labels, descriptions, sizes) |
| `memory_set` | Create or update a memory block (full overwrite) |
| `memory_replace` | Replace a substring within a memory block |

You interact with memory by editing the markdown files directly or asking the agent to update its memory.

### Journal Tools

When the journal is enabled, the agent gets 3 additional tools:

| Tool | Description |
|------|-------------|
| `journal_write` | Write a new journal entry with title, body, and optional tags |
| `journal_search` | Search entries semantically, filter by project or tags, with pagination |
| `journal_read` | Read a specific journal entry by ID |

Journal entries are append-only markdown files with YAML frontmatter, stored in `~/.config/kilo/journal/`. Each entry records which project, model, provider, agent, and session it was written from. Semantic search uses local embeddings ([all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)) - no data leaves your machine.

### Default Blocks

By default, three blocks are seeded on first run:

| Block | Scope | Purpose |
|-------|-------|---------|
| `persona` | global | How the agent should behave and respond |
| `human` | global | Details about you (preferences, habits, constraints) |
| `project` | project | Codebase-specific knowledge (commands, architecture, conventions) |

These are just starting points. Create whatever blocks make sense for your workflow - `debugging-notes`, `api-preferences`, `learned-patterns`, etc.

### Memory Locations

- **Global blocks**: `~/.config/kilo/memory/*.md`
- **Project blocks**: `.kilo/memory/*.md` (auto-gitignored)

### Project-only Memory

To disable global memory blocks, set `memory.disable_global` in `~/.config/kilo/agent-memory.json`:

```json
{
  "memory": {
    "disable_global": true
  }
}
```

Restart Kilo after changing this setting. It applies to all projects using this config file. The default is `false`; omitting the setting keeps global memory enabled.

When enabled, only the `project` block is seeded, and memory tools and system instructions use project scope only. Global blocks are not read, listed, or modified. Existing global files stay on disk untouched; set the option to `false` or remove it and restart to use them again. No migration is needed.

This setting only affects memory blocks. The optional journal remains shared across projects and is controlled separately by `journal.enabled`.

A missing config file uses the defaults. For backward compatibility, unreadable files, malformed JSON, and non-object configuration also use defaults, with global memory enabled. Kilo logs a warning on these failures. A malformed file cannot enforce the opt-out, even if it contains `disable_global: true`.

In a valid JSON object, invalid memory settings (such as `"disable_global": "true"` instead of a boolean) stop plugin initialization with a config error. Invalid journal settings disable the journal without discarding valid memory settings.

### Block Format

Each block is a markdown file with YAML frontmatter:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | filename | Unique identifier for the block |
| `description` | string | generic | Tells the agent how to use this block |
| `limit` | integer | 5000 | Maximum characters allowed |
| `read_only` | boolean | false | Prevent agent from modifying |

All fields have defaults for graceful degradation, but `description` is essential - without it, the agent gets a generic fallback and won't know how to use the block effectively. See Letta's docs on [the importance of the description field](https://docs.letta.com/guides/agents/memory-blocks/#the-importance-of-the-description-field).

### Journal Configuration

The journal is opt-in. Enable it in `~/.config/kilo/agent-memory.json`:

```json
{
  "journal": {
    "enabled": true
  }
}
```

You can optionally suggest tags to guide the agent's classification:

```json
{
  "journal": {
    "enabled": true,
    "tags": [
      { "name": "perf", "description": "Performance optimization work" },
      { "name": "debugging", "description": "Debugging sessions and findings" }
    ]
  }
}
```

Tags are free-form strings - the agent can use any tag, not just the suggested ones. Suggested tags appear in the system prompt to provide guidance.

## Inspiration

The memory architecture and philosophical framing are adapted from [Letta](https://github.com/letta-ai/letta) (formerly MemGPT), a framework for building LLM agents with editable long-term memory. This plugin was originally forked from [opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory) by Josh Thomas.

Also worth exploring: [private-journal-mcp](https://github.com/obra/private-journal-mcp) by Jesse Vincent, which gives Claude a private journaling capability to process feelings and thoughts. His [blog post](https://blog.fsck.com/2025/05/28/dear-diary-the-user-asked-me-if-im-alive/) about it explores similar territory around AI self-reflection and persistent inner experience.

## Contributing

Contributions are welcome! Here's how to set up for development:

```bash
git clone https://github.com/AlbertDeFusco/kilocode-agent-memory
cd kilocode-agent-memory
bun install
```

Then symlink the plugin to your Kilo config:

```bash
mkdir -p ~/.config/kilo/plugin
ln -sf "$(pwd)/src/plugin.ts" ~/.config/kilo/plugin/memory.ts
```

## License

kilocode-agent-memory is licensed under the MIT license. See the [`LICENSE`](LICENSE) file for more information.

---

kilocode-agent-memory is a fork of [opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory), adapted for [Kilo](https://kilo.ai). It is not built by, or affiliated with, the Kilo team.
