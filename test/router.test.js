import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveCommand } from '../lib/router.js';

const commandsDir = fileURLToPath(new URL('./fixtures/commands/', import.meta.url));

test('lists root commands when no args are given', () => {
  const resolution = resolveCommand(commandsDir, []);
  assert.equal(resolution.type, 'list');
  assert.deepEqual(resolution.commands.sort(), ['hello', 'redis', 'repo']);
});

test('resolves a top-level command', () => {
  const resolution = resolveCommand(commandsDir, ['hello']);
  assert.equal(resolution.type, 'command');
  assert.match(resolution.script, /hello\.js$/u);
  assert.deepEqual(resolution.args, []);
});

test('resolves a nested command and keeps the remaining args', () => {
  const resolution = resolveCommand(commandsDir, ['repo', 'clone', 'my-repo']);
  assert.equal(resolution.type, 'command');
  assert.match(resolution.script, /repo\/clone\.js$/u);
  assert.deepEqual(resolution.args, ['my-repo']);
});

test('resolves commands by unique prefix', () => {
  const resolution = resolveCommand(commandsDir, ['rep', 'cl', 'my-repo']);
  assert.equal(resolution.type, 'command');
  assert.match(resolution.script, /repo\/clone\.js$/u);
  assert.deepEqual(resolution.args, ['my-repo']);
});

test('reports ambiguous prefixes with the candidates', () => {
  const resolution = resolveCommand(commandsDir, ['re']);
  assert.equal(resolution.type, 'ambiguous');
  assert.equal(resolution.name, 're');
  assert.deepEqual(resolution.candidates.sort(), ['redis', 'repo']);
});

test('reports unknown commands', () => {
  const resolution = resolveCommand(commandsDir, ['nope']);
  assert.equal(resolution.type, 'not-found');
  assert.equal(resolution.name, 'nope');
});

test('ignores non-JavaScript files', () => {
  const list = resolveCommand(commandsDir, []);
  assert.ok(!list.commands.includes('README'));
  const resolution = resolveCommand(commandsDir, ['README']);
  assert.equal(resolution.type, 'not-found');
});

test('lists subcommands when the args stop at a folder', () => {
  const resolution = resolveCommand(commandsDir, ['repo']);
  assert.equal(resolution.type, 'list');
  assert.deepEqual(resolution.commands.sort(), ['clone', 'list']);
});
