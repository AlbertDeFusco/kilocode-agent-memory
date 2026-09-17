# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project attempts to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
## [${version}]
### Added - for new features
### Changed - for changes in existing functionality
### Deprecated - for soon-to-be removed features
### Removed - for now removed features
### Fixed - for any bug fixes
### Security - in case of vulnerabilities
[${version}]: https://github.com/AlbertDeFusco/kilocode-agent-memory/releases/tag/v${version}
-->

## [Unreleased]

### Changed

- Forked from [opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory) and adapted for [Kilo](https://kilo.ai)
- Replaced `@opencode-ai/plugin` dependency with `@kilocode/plugin`
- All config paths moved from `~/.config/opencode/` to `~/.config/kilo/`
- Project memory paths moved from `.opencode/memory/` to `.kilo/memory/`

### Removed

- OpenCode/Amp-specific development tooling (`.agents/`, `.amp/`)

## [0.2.0]

### Added

- Optional `memory.disable_global` setting for project-only memory blocks, tools, and system instructions; existing global files are preserved for re-enabling

### Changed

- Invalid memory settings in a valid JSON object report an initialization error; invalid journal settings no longer discard valid memory settings
- Unreadable, malformed, or non-object configuration retains the default-settings fallback (global memory enabled), now with a warning in OpenCode's logs

## [0.1.0]

### Added

- Letta-style editable memory blocks for OpenCode
- Three default memory blocks: `persona` (global), `human` (global), `project` (project)
- Two scopes: global blocks (`~/.config/opencode/memory/`) shared across all projects, project blocks (`.opencode/memory/`) scoped to codebase
- Three memory tools: `memory_list`, `memory_set`, `memory_replace`
- System prompt injection via `experimental.chat.system.transform` hook
- YAML frontmatter support for block metadata (label, description, limit, read_only)
- Automatic gitignore for project memory blocks
- Memory instructions and philosophical framing adapted from Letta

### New Contributors

- Josh Thomas <josh@joshthomas.dev> (maintainer)

[unreleased]: https://github.com/AlbertDeFusco/kilocode-agent-memory/compare/v0.2.0...HEAD
[0.1.0]: https://github.com/joshuadavidthomas/opencode-agent-memory/releases/tag/v0.1.0
[0.2.0]: https://github.com/joshuadavidthomas/opencode-agent-memory/compare/v0.1.0...v0.2.0
