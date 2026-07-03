import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const commandName = (entry) => entry.name.replace(/\.js$/u, '');

const entryInfo = (dir, entry) => {
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

const entriesOf = (dir) => readdirSync(dir, { withFileTypes: true })
  .filter((entry) => !entry.name.startsWith('.'))
  .map((entry) => entryInfo(dir, entry))
  .filter((entry) => entry.isFound)
  .filter((entry) => !entry.isFile || entry.name.endsWith('.js'))
  .sort((first, second) => (first.name < second.name ? -1 : 1));

const matchEntry = (entries, name) => {
  const candidates = entries.filter((entry) => commandName(entry).startsWith(name));
  const candidateNames = [...new Set(candidates.map(commandName))];
  const exact = entries.find((entry) => commandName(entry) === name);
  return { candidateNames, match: exact || (candidateNames.length === 1 ? candidates[0] : null) };
};

const unmatched = (name, candidateNames) => {
  if (candidateNames.length === 0) {
    return { name, type: 'not-found' };
  }
  return { candidates: candidateNames, name, type: 'ambiguous' };
};

export const listCommands = (dir) => entriesOf(dir).map(commandName);

export const resolveCommand = (commandsDir, argv) => {
  if (argv.length === 0) {
    return { commands: listCommands(commandsDir), type: 'list' };
  }

  const [name, ...rest] = argv;
  const { candidateNames, match } = matchEntry(entriesOf(commandsDir), name);
  if (!match) {
    return unmatched(name, candidateNames);
  }

  const next = join(commandsDir, match.name);
  if (match.isFile) {
    return { args: rest, script: next, type: 'command' };
  }
  return resolveCommand(next, rest);
};
