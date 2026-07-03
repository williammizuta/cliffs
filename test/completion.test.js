import assert from 'node:assert/strict';
import { test } from 'node:test';
import { completionScript } from '../lib/completion.js';

test('generates a bash completion script bound to the CLI name', () => {
  const script = completionScript('mycli', 'bash');
  assert.match(script, /complete -F _mycli_completions mycli/u);
  assert.match(script, /\$\(mycli --help 2>\/dev\/null\)/u);
  assert.doesNotMatch(script, /\$\(mycli 2>\/dev\/null\)/u);
});

test('generates a zsh completion script bound to the CLI name', () => {
  const script = completionScript('mycli', 'zsh');
  assert.match(script, /compdef _mycli mycli/u);
});

test('sanitizes CLI names for shell function names', () => {
  const script = completionScript('my-cli', 'bash');
  assert.match(script, /complete -F _my_cli_completions my-cli/u);
});

test('rejects unsupported shells', () => {
  assert.throws(() => completionScript('mycli', 'fish'), /Unsupported shell: fish/u);
});
