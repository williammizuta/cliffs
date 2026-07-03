#!/usr/bin/env node
import { run } from '../index.js';

await run({
  commandsDir: new URL('./commands/', import.meta.url),
  name: 'mycli',
  version: '0.1.0',
});
