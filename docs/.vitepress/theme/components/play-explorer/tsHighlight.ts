/** Minimal TS-ish highlighting for explorer code blocks (no runtime Shiki). */

const KEYWORDS = new Set([
  'async',
  'await',
  'break',
  'case',
  'catch',
  'const',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'null',
  'of',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'as',
  'is',
  'readonly',
  'interface',
  'enum',
]);

export type TsToken = { text: string; cls: string };

function pushKeywordOrIdent(out: TsToken[], word: string): void {
  if (KEYWORDS.has(word)) out.push({ text: word, cls: 'tok-kw' });
  else if (/^[A-Z][\w$]*$/.test(word)) out.push({ text: word, cls: 'tok-type' });
  else out.push({ text: word, cls: 'tok-id' });
}

/** Tokenize a single line for display (strings, comments, numbers, keywords). */
export function tokenizeTsLine(line: string): TsToken[] {
  const out: TsToken[] = [];
  let i = 0;

  const wsMatch = /^(\s+)/.exec(line.slice(i));
  if (wsMatch) {
    out.push({ text: wsMatch[1], cls: 'tok-ws' });
    i += wsMatch[1].length;
  }

  const rest = line.slice(i);
  const lineComment = /^(\/\/.*)$/.exec(rest);
  if (lineComment) {
    out.push({ text: lineComment[1], cls: 'tok-cmt' });
    return out;
  }

  while (i < line.length) {
    const ch = line[i];

    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      let j = i + 1;
      let esc = false;
      while (j < line.length) {
        if (esc) {
          esc = false;
          j++;
          continue;
        }
        if (line[j] === '\\') {
          esc = true;
          j++;
          continue;
        }
        if (line[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      out.push({ text: line.slice(i, j), cls: 'tok-str' });
      i = j;
      continue;
    }

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /\s/.test(line[j])) j++;
      out.push({ text: line.slice(i, j), cls: 'tok-ws' });
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[\d.]/.test(line[j])) j++;
      out.push({ text: line.slice(i, j), cls: 'tok-num' });
      i = j;
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      pushKeywordOrIdent(out, word);
      i = j;
      continue;
    }

    out.push({ text: ch, cls: 'tok-punct' });
    i++;
  }

  return out;
}
