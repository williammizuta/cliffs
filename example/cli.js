#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { run } from '../index.js';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

await run({
  commandsDir: new URL('./commands/', import.meta.url),
  name: 'mycli',
  version,
});
