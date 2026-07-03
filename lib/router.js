import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const entriesOf = function(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => entry.isDirectory() || (entry.isFile() && entry.name.endsWith('.js')));
};

const commandName = function(entry) {
  return entry.name.replace(/\.js$/u, '');
};

export function listCommands(dir) {
  return entriesOf(dir).map(commandName);
}

export function resolveCommand(commandsDir, argv) {
  const args = [...argv];
  let current = commandsDir;

  if (args.length === 0) {
    return { commands: listCommands(current), type: 'list' };
  }

  while (args.length > 0) {
    const name = args.shift();
    const entries = entriesOf(current);
    const exact = entries.find((entry) => entry.name === name || entry.name === `${name}.js`);
    const candidates = entries.filter((entry) => entry.name.startsWith(name));
    const match = exact || (candidates.length === 1 ? candidates[0] : null);

    if (match) {
      current = join(current, match.name);
      if (match.isFile()) {
        return { args, script: current, type: 'command' };
      }
    } else if (candidates.length === 0) {
      return { name, type: 'not-found' };
    } else {
      return {
        candidates: candidates.map(commandName),
        name,
        type: 'ambiguous',
      };
    }

    if (args.length === 0) {
      return { commands: listCommands(current), type: 'list' };
    }
  }

  return { name: argv.join(' '), type: 'not-found' };
}
