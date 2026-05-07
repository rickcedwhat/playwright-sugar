#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const version = process.argv[2];
if (!version) process.exit(0);

const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
if (!fs.existsSync(changelogPath)) process.exit(0);

const raw = fs.readFileSync(changelogPath, 'utf8');

// Escape version string for regex
const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Match start of line "## [version]"
const headerRegex = new RegExp(`^## \\[${escapedVersion}\\]`, 'm');
const match = raw.match(headerRegex);

if (!match) process.exit(0);

const start = match.index;
const afterHeader = raw.slice(start + match[0].length);
const lines = afterHeader.split(/\r?\n/);
const collected = [];
for (const line of lines) {
  if (line.startsWith('## [')) break;
  collected.push(line);
}

const body = collected.join('\n').trim();
if (!body) process.exit(0);

console.log(body);
