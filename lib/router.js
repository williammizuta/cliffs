import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const commandName = function(entry) {
  return entry.name.replace(/\.js$/u, '');
};

const entriesOf = function(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => entry.isDirectory() || (entry.isFile() && entry.name.endsWith('.js')))
    .sort((first, second) => (first.name < second.name ? -1 : 1));
};

export function listCommands(dir) {
  return entriesOf(dir).map(commandName);
}

export function resolveCommand(commandsDir, argv) {
  const args = [...argv];
  let current = commandsDir;

  while (args.length > 0) {
    const name = args.shift();
    const entries = entriesOf(current);
    const exact = entries.find((entry) => commandName(entry) === name);
    const candidates = entries.filter((entry) => commandName(entry).startsWith(name));
    const match = exact || (candidates.length === 1 ? candidates[0] : null);

    if (!match) {
      if (candidates.length === 0) {
        return { name, type: 'not-found' };
      }
      return {
        candidates: candidates.map(commandName),
        name,
        type: 'ambiguous',
      };
    }

    current = join(current, match.name);
    if (match.isFile()) {
      return { args, script: current, type: 'command' };
    }
  }

  return { commands: listCommands(current), type: 'list' };
}
