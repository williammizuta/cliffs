import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const commandName = function(entry) {
  return entry.name.replace(/\.js$/u, '');
};

const entryInfo = function(dir, entry) {
  if (entry.isSymbolicLink()) {
    try {
      const stats = statSync(join(dir, entry.name));
      return { isFile: stats.isFile(), isFound: stats.isDirectory() || stats.isFile(), name: entry.name };
    } catch (_error) {
      return { isFile: false, isFound: false, name: entry.name };
    }
  }
  return { isFile: entry.isFile(), isFound: entry.isDirectory() || entry.isFile(), name: entry.name };
};

const entriesOf = function(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .map((entry) => entryInfo(dir, entry))
    .filter((entry) => entry.isFound)
    .filter((entry) => !entry.isFile || entry.name.endsWith('.js'))
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
    const candidates = entries.filter((entry) => commandName(entry).startsWith(name));
    const candidateNames = [...new Set(candidates.map(commandName))];
    const exact = entries.find((entry) => commandName(entry) === name);
    const match = exact || (candidateNames.length === 1 ? candidates[0] : null);

    if (!match) {
      if (candidateNames.length === 0) {
        return { name, type: 'not-found' };
      }
      return {
        candidates: candidateNames,
        name,
        type: 'ambiguous',
      };
    }

    current = join(current, match.name);
    if (match.isFile) {
      return { args, script: current, type: 'command' };
    }
  }

  return { commands: listCommands(current), type: 'list' };
}
