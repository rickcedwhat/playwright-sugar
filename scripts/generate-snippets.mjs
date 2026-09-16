#!/usr/bin/env node
/**
 * Generate copy-paste lite snippets from annotated src helpers.
 *
 * Markers (TypeScript `//` comments in source):
 *
 *   // sugar-full-only-begin
 *   ...only in package export...
 *   // sugar-full-only-end
 *
 *   // sugar-full-only
 *   <next statement>                 — omit that statement from lite
 *
 *   // sugar-lite-replace: <code>    — emit <code> only in the lite snippet
 *
 * Usage:
 *   node scripts/generate-snippets.mjs           # write snippets/
 *   node scripts/generate-snippets.mjs --check   # exit 1 if snippets are stale
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** @type {{ source: string, snippet: string, title: string }[]} */
const MANIFEST = [
  {
    source: 'src/attemptAction.ts',
    snippet: 'snippets/attemptAction.lite.ts',
    title: 'attemptAction / detectState',
  },
  {
    source: 'src/verifiedFill.ts',
    snippet: 'snippets/verifiedFill.lite.ts',
    title: 'verifiedFill',
  },
  {
    source: 'src/clickToOpen.ts',
    snippet: 'snippets/clickToOpen.lite.ts',
    title: 'clickToOpen',
  },
  {
    source: 'src/relator.ts',
    snippet: 'snippets/relator.lite.ts',
    title: 'relator',
  },
];

const BEGIN = /^\s*\/\/\s*sugar-full-only-begin\s*$/;
const END = /^\s*\/\/\s*sugar-full-only-end\s*$/;
const LINE = /^\s*\/\/\s*sugar-full-only\s*$/;
const REPLACE = /^(\s*)\/\/\s*sugar-lite-replace:\s?(.*)$/;

/**
 * Strip robust-only regions and apply lite replacements.
 * @param {string} source
 * @returns {string}
 */
export function stripFullOnly(source) {
  const lines = source.split(/\r?\n/);
  const out = [];
  let omitting = false;
  let skipNextStatement = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (BEGIN.test(line)) {
      omitting = true;
      continue;
    }
    if (END.test(line)) {
      omitting = false;
      continue;
    }
    if (omitting) continue;

    if (LINE.test(line)) {
      skipNextStatement = true;
      continue;
    }

    const replaceMatch = line.match(REPLACE);
    if (replaceMatch) {
      const indent = replaceMatch[1] ?? '';
      const code = replaceMatch[2] ?? '';
      out.push(indent + code);
      continue;
    }

    if (skipNextStatement) {
      if (line.trim() === '') continue;
      skipNextStatement = false;
      let depth = parenDepth(line);
      while (depth > 0 && i + 1 < lines.length) {
        i++;
        depth += parenDepth(lines[i]);
      }
      continue;
    }

    out.push(line);
  }

  if (omitting) {
    throw new Error('Unclosed sugar-full-only-begin');
  }

  return collapseBlankLines(out.join('\n')).trimEnd() + '\n';
}

/** @param {string} line */
function parenDepth(line) {
  let d = 0;
  let inStr = null;
  let inTemplate = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const prev = line[i - 1];
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (inTemplate) {
      if (c === '`' && prev !== '\\') inTemplate = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = c;
      continue;
    }
    if (c === '`') {
      inTemplate = true;
      continue;
    }
    if (c === '(' || c === '{' || c === '[') d++;
    if (c === ')' || c === '}' || c === ']') d--;
  }
  return d;
}

/** @param {string} text */
function collapseBlankLines(text) {
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * @param {{ source: string, snippet: string, title: string }} entry
 * @param {string} body
 */
function withBanner(entry, body) {
  return (
    `/**\n` +
    ` * AUTO-GENERATED — do not edit by hand.\n` +
    ` * Source: ${entry.source}\n` +
    ` * Regenerate: pnpm run snippets:generate\n` +
    ` *\n` +
    ` * Lite copy-paste ${entry.title}. Same core behavior as the package\n` +
    ` * export; robust-only diagnostics and extras are stripped.\n` +
    ` */\n` +
    body
  );
}

function generateAll() {
  return MANIFEST.map((entry) => {
    const abs = path.join(root, entry.source);
    const raw = fs.readFileSync(abs, 'utf8');
    const body = stripFullOnly(raw);
    const content = withBanner(entry, body);
    return { entry, content };
  });
}

function main() {
  const check = process.argv.includes('--check');
  const results = generateAll();
  let stale = false;

  for (const { entry, content } of results) {
    const outPath = path.join(root, entry.snippet);
    if (check) {
      if (!fs.existsSync(outPath)) {
        console.error(`Missing snippet: ${entry.snippet}`);
        stale = true;
        continue;
      }
      const existing = fs.readFileSync(outPath, 'utf8');
      if (existing !== content) {
        console.error(`Stale snippet: ${entry.snippet} (run pnpm run snippets:generate)`);
        stale = true;
      } else {
        console.log(`ok  ${entry.snippet}`);
      }
    } else {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, content);
      console.log(`wrote ${entry.snippet}`);
    }
  }

  if (check && stale) {
    process.exit(1);
  }
}

main();
