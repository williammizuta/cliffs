#!/usr/bin/env node
import { run } from '../../../index.js';

await run({
  commandsDir: new URL('./commands/', import.meta.url),
  name: 'fixcli',
  version: '1.2.3',
});
