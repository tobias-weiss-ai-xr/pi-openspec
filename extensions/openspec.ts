/**
 * OpenSpec Deep-Integration Extension
 *
 * 1) Native `openspec` tool — lets the agent query spec-driven development
 *    state (status, doctor, context, list, show, validate, instructions,
 *    archive, store, spec) directly during a task, without typing slash
 *    commands.
 *
 * 2) Auto-context injection — at before_agent_start, if the current working
 *    directory (or an ancestor) contains an OpenSpec root (openspec/config.yaml)
 *    or the cwd is inside a registered store, the `openspec context` output is
 *    appended to the system prompt. The agent always knows the project's spec
 *    context for free. Cached per root and invalidated when the spec tree
 *    changes (fingerprint on config.yaml mtime + changes directory state).
 *
 * 3) /ospec command — run arbitrary openspec CLI commands interactively.
 */

import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@earendil-works/pi-coding-agent";
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

/**
 * Fingerprint an OpenSpec root so the auto-context cache can be invalidated
 * when the spec tree actually changes (config.yaml touched, change created /
 * deleted / modified), instead of living forever as before.
 */
function rootFingerprint(root: string): string {
    let fp = path.resolve(root);
    try {
        fp += ":" + fs.statSync(path.join(root, "openspec", "config.yaml")).mtimeMs;
    } catch {
        return fp + ":0";
    }
    try {
        const changes = path.join(root, "openspec", "changes");
        if (fs.existsSync(changes)) {
            let sig = 0;
            for (const n of fs.readdirSync(changes).sort()) {
                if (n === "archive" || n.startsWith(".")) continue;
                try {
                    sig = (sig * 31 + fs.statSync(path.join(changes, n)).mtimeMs) % 1e15;
                } catch {
                    /* ignore */
                }
            }
            fp += ":" + sig;
        }
    } catch {
        /* ignore */
    }
    return fp;
}

// Cache for auto-context, keyed by root fingerprint (local root or store).
let cachedFingerprint: string | null = null;
let cachedContext = "";

interface ToolParams {
    command: string;
    change?: string;
    item?: string;
    type?: string;
    json?: boolean;
    specs?: boolean;
    all?: boolean;
    changes?: boolean;
    archived?: boolean;
    strict?: boolean;
    skip?: boolean;
    yes?: boolean;
    novalidate?: boolean;
    store?: string;
}

/** Build the CLI argv for a curated command, forwarding the flags 1.9.0 accepts. */
function buildArgs(p: ToolParams): string[] | null {
    const args = [p.command];
    const store: string[] = p.store ? ["--store", p.store] : [];

    switch (p.command) {
        case "status":
            if (p.change) args.push("--change", p.change);
            if (p.json) args.push("--json");
            return args.concat(store);
        case "doctor":
        case "context":
            if (p.json) args.push("--json");
            return args.concat(store);
        case "list":
            // `--specs` is a boolean flag in the CLI; there is no `--spec <id>`.
            if (p.specs) args.push("--specs");
            if (p.json) args.push("--json");
            return args.concat(store);
        case "show":
            // show takes a POSITIONAL item name, not --change.
            if (p.item) args.push(p.item);
            if (p.type) args.push("--type", p.type);
            if (p.json) args.push("--json");
            return args.concat(store);
        case "validate":
            if (p.all) args.push("--all");
            else if (p.changes) args.push("--changes");
            else if (p.archived) args.push("--archived");
            else if (p.specs) args.push("--specs");
            if (p.item) args.push(p.item);
            if (p.strict) args.push("--strict");
            if (p.json) args.push("--json");
            return args.concat(store);
        case "archive":
            // archive takes a POSITIONAL change name.
            if (p.change) args.push(p.change);
            if (p.yes) args.push("--yes");
            if (p.skip) args.push("--skip-specs");
            if (p.novalidate) args.push("--no-validate");
            if (p.json) args.push("--json");
            return args.concat(store);
        case "instructions":
            if (p.item) args.push(p.item);
            if (p.change) args.push("--change", p.change);
            if (p.json) args.push("--json");
            return args.concat(store);
        case "new":
            args.push("change");
            if (p.change) args.push(p.change);
            return args; // `new` does not take --store
        case "spec":
            if (p.item === "list") {
                args.push("list");
                if (p.json) args.push("--json");
            } else if (p.item === "show" || p.item === "validate") {
                const sub = p.item;
                args.push(sub);
                if (p.change) args.push(p.change);
                if (p.json) args.push("--json");
            }
            return args;
        case "store":
            if (p.item) args.push(p.item);
            if (p.change) args.push(p.change);
            if (p.json) args.push("--json");
            return args;
        default:
            return null; // unsupported curated command; use /ospec for passthrough
    }
}

export default function (pi: ExtensionAPI) {
    pi.registerTool({
        name: "openspec",
        label: "OpenSpec Specs",
        description: "Inspect and manage OpenSpec spec-driven development artifacts. Commands: status (change progress + root), doctor (relationship health), context (working context), list (changes or specs), show (change/spec details), validate (validate all/changes/specs/archived), instructions (artifact guidance), archive (native archive), store (list/register stores), spec (show/list/validate specs). Use before and during implementation to stay aligned with specs.",
        promptSnippet: "openspec: Query and manage spec-driven development state (status, doctor, context, list, show, validate, instructions, archive, store)",
        parameters: Type.Object({
            command: Type.String({ description: "status, doctor, context, list, show, validate, instructions, archive, store, spec, new" }),
            change: Type.Optional(Type.String({ description: "change name (for status/instructions/archive/new change)" })),
            item: Type.Optional(Type.String({ description: "positional item: spec id (for show), artifact id (for instructions, e.g. proposal/specs/design/tasks/apply), or store subcommand (list/register)" })),
            type: Type.Optional(Type.String({ description: "item type when ambiguous (for show/validate): change|spec" })),
            json: Type.Optional(Type.Boolean({ description: "return JSON output" })),
            specs: Type.Optional(Type.Boolean({ description: "list specs instead of changes; validate --specs" })),
            all: Type.Optional(Type.Boolean({ description: "validate everything (validate --all)" })),
            changes: Type.Optional(Type.Boolean({ description: "validate all changes (validate --changes)" })),
            archived: Type.Optional(Type.Boolean({ description: "validate archived changes have all tasks done (validate --archived)" })),
            strict: Type.Optional(Type.Boolean({ description: "enable strict validation (validate --strict)" })),
            skip: Type.Optional(Type.Boolean({ description: "skip spec syncing during archive (archive --skip-specs)" })),
            yes: Type.Optional(Type.Boolean({ description: "skip confirmation prompts during archive (archive --yes)" })),
            novalidate: Type.Optional(Type.Boolean({ description: "skip validation during archive (archive --no-validate)" })),
            store: Type.Optional(Type.String({ description: "registered store id to operate on (--store)" })),
        }),
        async execute(_id: string, params: ToolParams, _sig: AbortSignal | undefined, _up: any, ctx: ExtensionContext) {
            const cwd = ctx.cwd || process.cwd();
            const args = buildArgs(params);
            if (!args) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Unsupported command "${params.command}". Supported: status, doctor, context, list, show, validate, instructions, archive, store, spec, new. For arbitrary commands use /ospec.`,
                        },
                    ],
                    details: { command: params.command, supported: false },
                };
            }
            return {
                content: [{ type: "text", text: await run(pi, args, cwd) }],
                details: { command: params.command, supported: true },
            };
        },
    });

    pi.on("before_agent_start", async (event) => {
        const cwd = event.systemPromptOptions?.cwd || process.cwd();
        const root = findOpenSpecRoot(cwd);

        let contextText = "";
        let key = "";
        if (root) {
            key = rootFingerprint(root);
            if (cachedFingerprint !== key) {
                cachedFingerprint = key;
                cachedContext = await run(pi, ["context"], root);
            }
            contextText = cachedContext;
        } else {
            // Not in a local root — maybe inside a registered store.
            const storeId = await findStoreId(pi, cwd);
            if (storeId) {
                key = "store:" + rootFingerprint(cwd) + ":" + storeId;
                if (cachedFingerprint !== key) {
                    cachedFingerprint = key;
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
        handler: async (args: string, ctx: ExtensionCommandContext) => {
            const cwd = ctx.cwd || process.cwd();
            const argv = args.trim().split(/\s+/).filter(Boolean);
            const result = await run(pi, argv.length ? argv : ["status"], cwd);
            if (ctx.hasUI) {
                ctx.ui.notify(result.length > 2000 ? result.slice(0, 2000) + "…" : result, "info");
            }
        },
    });
}
