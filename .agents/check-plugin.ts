import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "@huggingface/transformers";
import { MemoryPlugin } from "../src/plugin";

// Exercise real hooks/tools directly, without an LLM or the unit-test mocks.
// This is not a substitute for an end-to-end OpenCode session test.
env.allowRemoteModels = false;
// Bun captures the home directory at startup, so isolation needs a new process.
if (!process.argv.includes("--isolated")) {
  const root = await mkdtemp(join(tmpdir(), "agent-memory-smoke-"));
  let result: number;
  try {
    result = Bun.spawnSync([process.execPath, import.meta.path, "--isolated"], {
      env: { ...process.env, HOME: root },
      stdout: "inherit",
      stderr: "inherit",
    }).exitCode;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  process.exit(result);
}
const root = homedir();
{
  const directory = join(root, "project");
  const configDir = join(root, ".config/opencode");
  await mkdir(configDir, { recursive: true });
  // Only directory is consumed from the host context by this plugin.
  const context = { directory } as Parameters<typeof MemoryPlugin>[0];
  const disabled = await MemoryPlugin(context);
  assert.deepEqual(Object.keys(disabled.tool!).sort(), ["memory_list", "memory_replace", "memory_set"]);
  await writeFile(join(configDir, "agent-memory.json"), '{"journal":{"enabled":true}}');
  const hooks = await MemoryPlugin(context);
  assert.equal(Object.keys(hooks.tool!).length, 6);
  const toolContext = {
    agent: "smoke-agent",
    sessionID: "smoke-session",
  } as Parameters<NonNullable<typeof hooks.tool>[string]["execute"]>[1];
  await hooks.tool!.memory_set!.execute({ label: "orb-check", value: "orb-original-marker" }, toolContext);
  await hooks.tool!.memory_replace!.execute({ label: "orb-check", oldText: "original", newText: "updated" }, toolContext);
  const output = { system: ["provider-header", "existing-instructions"] };
  await hooks["experimental.chat.system.transform"]!({ sessionID: "smoke-session" }, output);
  assert.equal(output.system[0], "provider-header");
  assert.ok(output.system[1]!.includes("orb-updated-marker"));
  assert.ok(!output.system[1]!.includes("orb-original-marker"));
  assert.ok(output.system.at(-1)!.includes("journal"));
  assert.ok((await hooks.tool!.memory_list!.execute({}, toolContext)).includes("project:orb-check"));

  const messageInput = {
    sessionID: "smoke-session",
    model: { modelID: "smoke-model", providerID: "smoke-provider" },
  } as Parameters<NonNullable<typeof hooks["chat.message"]>>[0];
  await hooks["chat.message"]!(messageInput, {} as Parameters<NonNullable<typeof hooks["chat.message"]>>[1]);
  await hooks.tool!.journal_write!.execute({ title: "Fetch", body: "The puppy chased a ball in the garden." }, toolContext);
  const journalDir = join(configDir, "journal");
  const filename = (await readdir(journalDir)).find((name) => name.endsWith(".md"))!;
  const id = filename.slice(0, -3);
  const embedding = JSON.parse(await readFile(join(journalDir, `${id}.embedding`), "utf8"));
  assert.equal(embedding.length, 384);
  assert.ok(embedding.every(Number.isFinite));
  const entry = await hooks.tool!.journal_read!.execute({ id }, toolContext);
  for (const value of ["smoke-model", "smoke-provider", "smoke-agent", "smoke-session"]) assert.ok(entry.includes(value));
  // A paraphrase with no literal substring match requires real semantic search.
  const search = await hooks.tool!.journal_search!.execute({ text: "A dog playing outdoors" }, toolContext);
  assert.ok(search.includes(id));
  console.log("Plugin OK: journal off/on, memory mutation, system/message hooks, journal metadata, cached embeddings and semantic search");
}
