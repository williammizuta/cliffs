import { mkdirSync, mkdtempSync, symlinkSync } from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { resolveCommand } from '../lib/router.js';
import { test } from 'node:test';
import { tmpdir } from 'node:os';

const commandsDir = fileURLToPath(new URL('./fixtures/commands/', import.meta.url));
const collisionDir = fileURLToPath(new URL('./fixtures/collision/', import.meta.url));

test('lists root commands alphabetically when no args are given', () => {
  const resolution = resolveCommand(commandsDir, []);
  assert.equal(resolution.type, 'list');
  assert.deepEqual(resolution.commands, ['hello', 'redis', 'repo']);
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
  assert.match(resolution.script, /repo[\\/]clone\.js$/u);
  assert.deepEqual(resolution.args, ['my-repo']);
});

test('resolves commands by unique prefix', () => {
  const resolution = resolveCommand(commandsDir, ['rep', 'cl', 'my-repo']);
  assert.equal(resolution.type, 'command');
  assert.match(resolution.script, /repo[\\/]clone\.js$/u);
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
  assert.deepEqual(resolution.commands, ['clone', 'list']);
});

test('does not match prefixes that include the .js extension', () => {
  const resolution = resolveCommand(commandsDir, ['hello.j']);
  assert.equal(resolution.type, 'not-found');
  assert.equal(resolution.name, 'hello.j');
});

test('prefers the directory when a directory and a file share a name', () => {
  const resolution = resolveCommand(collisionDir, ['dup']);
  assert.equal(resolution.type, 'list');
  assert.deepEqual(resolution.commands, ['child']);
});

test('resolves a prefix whose candidates share a single name', () => {
  const resolution = resolveCommand(collisionDir, ['du']);
  assert.equal(resolution.type, 'list');
  assert.deepEqual(resolution.commands, ['child']);
});

test('follows symlinked commands and directories', { skip: process.platform === 'win32' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'cliffs-symlink-'));
  symlinkSync(join(commandsDir, 'hello.js'), join(dir, 'linked.js'));
  symlinkSync(join(commandsDir, 'repo'), join(dir, 'tree'));
  mkdirSync(join(dir, 'broken-target'));
  symlinkSync(join(dir, 'broken-target', 'missing.js'), join(dir, 'dangling.js'));

  assert.deepEqual(resolveCommand(dir, []).commands, ['broken-target', 'linked', 'tree']);

  const file = resolveCommand(dir, ['linked']);
  assert.equal(file.type, 'command');
  assert.match(file.script, /linked\.js$/u);

  const nested = resolveCommand(dir, ['tree', 'clone']);
  assert.equal(nested.type, 'command');
  assert.match(nested.script, /clone\.js$/u);
});
