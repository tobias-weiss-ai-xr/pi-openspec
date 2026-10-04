// Smoke test: JIT-load the extension with a stub API and exercise the tool +
// command registration and a couple of command paths (no CLI side effects).
// Run: node scripts/smoke-ext.mjs
import { pathToFileURL } from "url";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Location of pi's bundled runtime deps (jiti). Override with PI_NODE_MODULES
// on machines/containers where pi lives elsewhere.
const piMods =
  process.env.PI_NODE_MODULES ||
  "C:/Users/Tobias/AppData/Local/pi-node/current/node_modules/@earendil-works/pi-coding-agent/node_modules";
const { createJiti } = await import(pathToFileURL(path.join(piMods, "jiti/lib/jiti.mjs")).href);

// Minimal typebox stand-in: the extension only builds parameter metadata with
// Type.* at load time; nothing is validated in this harness.
const stubDir = path.join(os.tmpdir(), "pi-ospec-tbstub");
fs.mkdirSync(stubDir, { recursive: true });
fs.writeFileSync(path.join(stubDir, "package.json"), JSON.stringify({ name: "tbstub", type: "module", main: "index.mjs" }));
fs.writeFileSync(
  path.join(stubDir, "index.mjs"),
  `export const Type = { Object: (p) => ({ type: "object", properties: p }), String: (o = {}) => ({ type: "string", ...o }), Boolean: (o = {}) => ({ type: "boolean", ...o }), Optional: (t) => ({ ...t, optional: true }) };`,
);

const jiti = createJiti(import.meta.url, {
  alias: {
    "typebox": path.join(stubDir, "index.mjs"),
    "@earendil-works/pi-coding-agent": path.join(piMods, "@earendil-works/pi-coding-agent"),
  },
  interopDefault: true,
});

let toolDef, commandDef, beforeAgentHandler;
const calls = [];
const stubAPI = {
  registerTool(def) { toolDef = def; },
  on(ev, handler) { if (ev === "before_agent_start") beforeAgentHandler = handler; },
  registerCommand(name, def) { commandDef = { name, ...def }; },
  exec(cmd, args, opts) {
    calls.push({ cmd, args });
    return Promise.resolve({ code: 0, stdout: `\u001b[32mok ${args.join(" ")}\u001b[0m`, stderr: "" });
  },
};

const load = await jiti.import(path.join(root, "extensions/openspec.ts"));
const factory = load.default ?? load;
factory(stubAPI);

if (!toolDef) throw new Error("FAIL: tool not registered");
if (!commandDef || commandDef.name !== "ospec") throw new Error("FAIL: /ospec command not registered");

// exercise execute() with the stub cwd
const ctx = { cwd: root };
for (const params of [
  { command: "status", change: "demo", json: true, store: "s1" },
  { command: "validate", all: true, strict: true },
  { command: "bogus" },
]) {
  const res = await toolDef.execute("id", params, undefined, undefined, ctx);
  const text = res.content?.[0]?.text ?? "";
  if (params.command === "bogus") {
    if (!/Unsupported command/.test(text)) throw new Error("FAIL: bogus command should be rejected");
  } else if (!/ok /.test(text) || !/^ok /.test(text.trim())) {
    throw new Error(`FAIL: ${params.command} unexpected output: ${text}`);
  }
}

// before_agent_start: repo root IS an OpenSpec root -> inject context
const inRoot = await beforeAgentHandler?.({ systemPrompt: "base", systemPromptOptions: { cwd: root } });
if (!inRoot?.systemPrompt?.includes("[OpenSpec context]")) {
  throw new Error("FAIL: expected context injection inside an OpenSpec root");
}
// before_agent_start: non-root cwd -> no injection
const inTmp = await beforeAgentHandler?.({ systemPrompt: "base", systemPromptOptions: { cwd: os.tmpdir() } });
if (!inTmp || Object.keys(inTmp).length !== 0) {
  throw new Error("FAIL: expected no context injection for non-root cwd");
}

const execArgs = JSON.stringify(calls[0].args);
if (execArgs !== JSON.stringify(["status", "--change", "demo", "--json", "--store", "s1"])) {
  throw new Error(`FAIL: status args: ${execArgs}`);
}

console.log("smoke OK: tool + /ospec registered, status/validate/bogus handled, args correct");
