import type { Plugin, ToolDefinition } from "@kilocode/plugin";

import {
  buildJournalSystemNote,
  createJournalStore,
  loadConfig,
} from "./journal";
import { createMemoryStore } from "./memory";
import { renderMemoryBlocks } from "./prompt";
import {
  JournalRead,
  JournalSearch,
  JournalWrite,
  MemoryList,
  MemoryReplace,
  MemorySet,
} from "./tools";
import type { JournalContext } from "./tools";

export const MemoryPlugin: Plugin = async ({ directory, worktree, client }, options) => {
  const projectRoot = worktree || directory;

  const config = await loadConfig(
    undefined,
    (message) => {
      void client.app.log({
        body: { service: "agent-memory", level: "warn", message },
      }).catch(() => {});
    },
    options,
  );
  const disableGlobal = config.memory?.disable_global === true;

  const store = createMemoryStore(projectRoot, { disableGlobal });
  await store.ensureSeed();

  const journalEnabled = config.journal?.enabled === true;

  const journalCtx: JournalContext = {
    directory: projectRoot,
    model: "",
    provider: "",
    variant: "",
    sessionID: "",
  };

  let journalTools: Record<string, ToolDefinition> = {};
  let journalSystemNote = "";

  if (journalEnabled) {
    const journalStore = createJournalStore();
    journalTools = {
      journal_write: JournalWrite(journalStore, journalCtx),
      journal_read: JournalRead(journalStore),
      journal_search: JournalSearch(journalStore),
    };
    journalSystemNote = buildJournalSystemNote(config.journal?.tags);
  }

  return {
    "chat.message": async (input, _output) => {
      if (input.model) {
        journalCtx.model = input.model.modelID;
        journalCtx.provider = input.model.providerID;
      }
      if (input.variant) {
        journalCtx.variant = input.variant;
      }
      if (input.sessionID) {
        journalCtx.sessionID = input.sessionID;
      }
    },

    "experimental.chat.system.transform": async (_input, output) => {
      const blocks = await store.listBlocks("all");
      const xml = renderMemoryBlocks(blocks, { disableGlobal });
      if (!xml) return;

      const insertAt = output.system.length > 0 ? 1 : 0;
      output.system.splice(insertAt, 0, xml);

      if (journalSystemNote) {
        output.system.push(journalSystemNote);
      }
    },

    tool: {
      memory_list: MemoryList(store, { disableGlobal }),
      memory_set: MemorySet(store, { disableGlobal }),
      memory_replace: MemoryReplace(store, { disableGlobal }),
      ...journalTools,
    },
  };
};
