#!/usr/bin/env node
import { run } from '../../index.js';

await run({
  commandsDir: new URL('./does-not-exist/', import.meta.url),
  name: 'ghost',
});
