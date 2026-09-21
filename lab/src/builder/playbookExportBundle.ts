/**
 * Standalone playbook download bundle: generated playbook + vendored Play/Playbook
 * runtime with imports rewritten to the published sugar package.
 */
import playSourceRaw from '../../../deprecated/playbook/play.ts?raw';
import playbookSourceRaw from '../../../deprecated/playbook/playbook.ts?raw';
import { buildZipBlob } from './zipStore';

/** Rewrite monorepo-relative sugar imports to the published package. */
export function toStandalonePlayRuntime(source: string): string {
  return source
    .replace(
      /from ['"]\.\.\/\.\.\/src\/attemptAction\.js['"]/g,
      "from '@rickcedwhat/playwright-sugar'"
    )
    .replace(
      /from ['"]\.\.\/\.\.\/src\/outcomes\.js['"]/g,
      "from '@rickcedwhat/playwright-sugar'"
    );
}

export function getStandalonePlaySource(): string {
  return toStandalonePlayRuntime(playSourceRaw);
}

export function getStandalonePlaybookSource(): string {
  // Only depends on ./play.js — already standalone beside play.ts
  return playbookSourceRaw;
}

export function buildPlaybookExportZip(opts: {
  playbookFileName: string;
  generatedCode: string;
}): Blob {
  return buildZipBlob([
    { name: opts.playbookFileName, content: opts.generatedCode },
    { name: 'play.ts', content: getStandalonePlaySource() },
    { name: 'playbook.ts', content: getStandalonePlaybookSource() },
  ]);
}
