import { readFileSync } from 'node:fs';

export const SUPPORTED_SHELLS = ['bash', 'zsh'];

export const completionScript = (name, shell) => {
  if (!SUPPORTED_SHELLS.includes(shell)) {
    throw new Error(`Unsupported shell: ${shell}. Supported shells: ${SUPPORTED_SHELLS.join(', ')}`);
  }

  const template = readFileSync(new URL(`./templates/completion.${shell}`, import.meta.url), 'utf8');
  const functionName = `_${name.replace(/[^a-zA-Z0-9_]/gu, '_')}`;

  return template
    .replaceAll('__CLI_FN__', functionName)
    .replaceAll('__CLI_NAME__', name);
};
