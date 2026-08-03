/**
 * OpenSpec Deep-Integration Extension
 *
 * 1) Native `openspec` tool — lets the agent query spec-driven development
 *    state (status, doctor, context, list, show, validate) directly during a
 *    task, without typing slash commands.
 *
 * 2) Auto-context injection — at before_agent_start, if the current working
 *    directory (or an ancestor) contains an OpenSpec root (openspec/config.yaml)
 *    or the cwd is inside a registered store, the `openspec context` output is
 *    appended to the system prompt. The agent always knows the project's spec
 *    context for free. Cached per root to avoid per-turn CLI overhead.
 *
 * 3) /ospec command — run arbitrary openspec CLI commands interactively.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import * as path from "path";
import * as fs from "fs";

const OS = "openspec";

function stripAnsi(s: string): string {
    return s.replace(/\u001b\[[0-9;]*m/g, "").trim();
}

async function run(pi: ExtensionAPI, args: string[], cwd: string): Promise<string> {
    try {
        const result = await pi.exec(OS, args, { timeout: 30000, cwd });
        const out = stripAnsi(result.stdout || "");
        const err = stripAnsi(result.stderr || "");
        return result.code !== 0 ? `Error: ${err || out}` : out || "(no output)";
    } catch (e: any) {
        return `openspec error: ${e.message}`;
    }
}

/** Walk up from cwd looking for an OpenSpec root marker. */
function findOpenSpecRoot(cwd: string): string | null {
    let dir = path.resolve(cwd);
    for (;;) {
        if (fs.existsSync(path.join(dir, "openspec", "config.yaml"))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

/** Check whether cwd is inside a registered OpenSpec store. */
async function findStoreId(pi: ExtensionAPI, cwd: string): Promise<string | null> {
    try {
        const result = await pi.exec(OS, ["store", "list", "--json"], { timeout: 10000, cwd });
        if (result.code !== 0) return null;
        const data = JSON.parse(result.stdout || "{}");
        const stores = data.stores || [];
        const abs = path.resolve(cwd);
        for (const s of stores) {
            const root = s.root || s.path || s.dir;
            if (root && (abs === path.resolve(root) || abs.startsWith(path.resolve(root) + path.sep))) {
                return s.id || null;
            }
        }
        return null;
    } catch {
        return null;
    }
}

// Per-root cache for auto-context
let cachedRoot: string | null = null;
let cachedContext = "";

export default function (pi: ExtensionAPI) {
    pi.registerTool({
        name: "openspec",
        label: "OpenSpec Specs",
        description: "Inspect and manage OpenSpec spec-driven development artifacts. Commands: status (change progress + root), doctor (relationship health), context (working context), list (changes or specs), show (change details), validate (validate changes/specs). Use before and during implementation to stay aligned with specs.",
        promptSnippet: "openspec: Query spec-driven development state (status, doctor, context, list, show, validate)",
        parameters: Type.Object({
            command: Type.String({ description: "status, doctor, context, list, show, validate" }),
            change: Type.Optional(Type.String({ description: "change name (for show)" })),
            spec: Type.Optional(Type.String({ description: "spec path or id (for list --specs)" })),
            json: Type.Optional(Type.Boolean({ description: "return JSON output" })),
        }),
        async execute(_id: string, params: { command: string; change?: string; spec?: string; json?: boolean }, _sig: AbortSignal, _up: any, ctx: ExtensionContext) {
            const cwd = ctx.cwd || process.cwd();
            const args = [params.command];
            if (params.json) args.push("--json");
            if (params.change) args.push("--change", params.change);
            if (params.spec) args.push("--spec", params.spec);
            return await run(pi, args, cwd);
        },
    });

    pi.on("before_agent_start", async (event) => {
        const cwd = event.systemPromptOptions?.cwd || process.cwd();
        const root = findOpenSpecRoot(cwd);

        let contextText = "";
        if (root) {
            if (cachedRoot !== root) {
                cachedRoot = root;
                cachedContext = await run(pi, ["context"], root);
            }
            contextText = cachedContext;
        } else {
            // Not in a local root — maybe inside a registered store.
            const storeId = await findStoreId(pi, cwd);
            if (storeId) {
                const key = "store:" + storeId;
                if (cachedRoot !== key) {
                    cachedRoot = key;
                    cachedContext = await run(pi, ["context", "--store", storeId], cwd);
                }
                contextText = cachedContext;
            }
        }

        if (!contextText || contextText.startsWith("Error:")) return {};

        return {
            systemPrompt: event.systemPrompt + "\n\n[OpenSpec context]\n" + contextText,
        };
    });

    pi.registerCommand("ospec", {
        description: "Run an OpenSpec CLI command (e.g. /ospec status, /ospec doctor, /ospec context)",
        handler: async (args: string, ctx: ExtensionContext) => {
            const cwd = ctx.cwd || process.cwd();
            const argv = args.trim().split(/\s+/).filter(Boolean);
            const result = await run(pi, argv.length ? argv : ["status"], cwd);
            if (ctx.hasUI) {
                ctx.ui.notify(result.length > 2000 ? result.slice(0, 2000) + "…" : result, "info");
            }
            return result;
        },
    });
}
