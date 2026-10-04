#!/usr/bin/env node
/**
 * pi-openspec packaging hygiene check.
 *
 * Verifies that the distributed skill/prompt set stays coherent:
 *   1. Every skill directory has a valid SKILL.md with required frontmatter.
 *   2. Every slash-command prompt has a description frontmatter.
 *   3. Every skill has a matching prompt and vice versa (name mapping table).
 *   4. Every `/opsx-<name>` referenced anywhere in skills/prompts resolves to
 *      a shipped prompt file — no dangling workflow mentions.
 *   5. Package manifest hygiene: `files[]` entries and `pi.image` asset exist,
 *      and every shipped prompt / slash command is documented in the README.
 *
 * Exit code 1 on any violation (CI-safe).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** canonical name mapping skill -> prompt stem */
const PROMPT_FOR_SKILL = {
  "openspec-new-change": "opsx-new",
  "openspec-propose": "opsx-propose",
  "openspec-explore": "opsx-explore",
  "openspec-continue-change": "opsx-continue",
  "openspec-apply-change": "opsx-apply",
  "openspec-ff-change": "opsx-ff",
  "openspec-update-change": "opsx-update",
  "openspec-sync-specs": "opsx-sync",
  "openspec-verify-change": "opsx-verify",
  "openspec-archive-change": "opsx-archive",
  "openspec-bulk-archive-change": "opsx-bulk-archive",
  "openspec-onboard": "opsx-onboard",
};

function frontmatter(file, pathStr) {
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`${pathStr}: missing frontmatter`);
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

const errors = [];
const skills = fs
  .readdirSync(path.join(root, "skills"))
  .filter((d) => fs.statSync(path.join(root, "skills", d)).isDirectory());
const prompts = fs
  .readdirSync(path.join(root, "prompts"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));

// 1. skills exist with required frontmatter
for (const dir of skills) {
  const skillFile = path.join(root, "skills", dir, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    errors.push(`skill ${dir}: missing SKILL.md`);
    continue;
  }
  try {
    const fm = frontmatter(skillFile, `skills/${dir}/SKILL.md`);
    for (const k of ["name", "description", "allowed-tools", "compatibility"]) {
      if (!fm[k]) errors.push(`skill ${dir}: missing frontmatter key '${k}'`);
    }
    if (fm.name && fm.name !== dir) errors.push(`skill ${dir}: frontmatter name '${fm.name}' != dir`);
  } catch (e) {
    errors.push(e.message);
  }
}

// 2. prompts have description
for (const stem of prompts) {
  const promptFile = path.join(root, "prompts", `${stem}.md`);
  try {
    const fm = frontmatter(promptFile, `prompts/${stem}.md`);
    if (!fm.description) errors.push(`prompt ${stem}: missing description frontmatter`);
  } catch (e) {
    errors.push(e.message);
  }
}

// 3. pairing
for (const [skill, promptStem] of Object.entries(PROMPT_FOR_SKILL)) {
  if (!skills.includes(skill)) errors.push(`mapping: skill '${skill}' not shipped`);
  if (!prompts.includes(promptStem)) errors.push(`mapping: prompt '${promptStem}' not shipped`);
}
// every prompt has a skill mapping
for (const stem of prompts) {
  const hasSkill = Object.values(PROMPT_FOR_SKILL).includes(stem);
  if (!hasSkill) errors.push(`prompt ${stem}: no skill mapping entry`);
}

// 4. every /opsx-<x> referenced resolves
const allText =
  fs
    .readdirSync(path.join(root, "skills"))
    .flatMap((d) => {
      const f = path.join(root, "skills", d, "SKILL.md");
      return fs.existsSync(f) ? [fs.readFileSync(f, "utf8")] : [];
    })
    .join("\n") +
  fs.readdirSync(path.join(root, "prompts")).map((f) => fs.readFileSync(path.join(root, "prompts", f), "utf8")).join("\n");
for (const m of allText.matchAll(/\/opsx-([a-z-]+)\b/g)) {
  const stem = `opsx-${m[1]}`;
  if (!prompts.includes(stem)) errors.push(`dangling slash-command reference: /${stem}`);
}

// 5. package manifest + README hygiene
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const entry of pkg.files || []) {
  if (!fs.existsSync(path.join(root, entry))) errors.push(`package.json: files entry '${entry}' does not exist`);
}
const image = (pkg.pi && pkg.pi.image) || "";
// pi.image typically points at raw.githubusercontent.com/<owner>/<repo>/main/<path>
const imagePath = image.replace(/^https?:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/main\//, "");
if (imagePath && !/^https?:\/\//.test(imagePath) && !fs.existsSync(path.join(root, imagePath))) {
  errors.push(`package.json: pi.image asset missing on disk: '${imagePath}'`);
}
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const docPrompts = new Set([...readme.matchAll(/\/opsx-([a-z-]+)\b/g)].map((m) => `opsx-${m[1]}`));
const missingFromReadme = prompts.filter((p) => !docPrompts.has(p));
if (missingFromReadme.length) errors.push(`README: /opsx-* undocumented for: ${missingFromReadme.join(", ")}`);
const danglingReadme = [...docPrompts].filter((p) => !prompts.includes(p));
if (danglingReadme.length) errors.push(`README: references prompt(s) not shipped: ${danglingReadme.join(", ")}`);

if (errors.length) {
  console.error(`pi-openspec check: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`pi-openspec check: OK (${skills.length} skills, ${prompts.length} prompts, manifest + README consistent)`);
