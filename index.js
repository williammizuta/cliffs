import { DocoptExit, docopt } from 'docopt';
import { statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { completionScript } from './lib/completion.js';
import { resolveCommand } from './lib/router.js';

export { completionScript, SUPPORTED_SHELLS } from './lib/completion.js';
export { listCommands, resolveCommand } from './lib/router.js';

export const EXIT_CODES = {
  ambiguousCommand: 2,
  commandNotFound: 1,
  misconfigured: 3,
  requirementsFailed: 4,
  runtimeError: 5,
  success: 0,
  usageError: 64,
};

const finish = function(code) {
  process.exitCode = code;
  return code;
};

const isDirectory = function(path) {
  try {
    return statSync(path).isDirectory();
  } catch (_error) {
    return false;
  }
};

const printList = function(commands) {
  if (commands.length === 0) {
    console.log('No commands found');
    return;
  }
  console.log(`Available commands:\n${commands.map((command) => ` - ${command}`).join('\n')}`);
};

const runCompletionBuiltin = function(name, params, helpRequested) {
  const usage = `Usage: ${name} completion (bash|zsh)`;
  if (helpRequested) {
    console.log(usage);
    return finish(EXIT_CODES.success);
  }

  const shell = params[1];
  if (shell === 'bash' || shell === 'zsh') {
    process.stdout.write(completionScript(name, shell));
    return finish(EXIT_CODES.success);
  }
  console.error(usage);
  return finish(EXIT_CODES.usageError);
};

const handleResolution = function(resolution) {
  if (resolution.type === 'list') {
    printList(resolution.commands);
    return finish(EXIT_CODES.success);
  }

  if (resolution.type === 'not-found') {
    console.error(`Command ${resolution.name} not found`);
    return finish(EXIT_CODES.commandNotFound);
  }

  if (resolution.type === 'ambiguous') {
    console.error(`Ambiguous command ${resolution.name}. Possible commands:\n${resolution.candidates.map((candidate) => ` - ${candidate}`).join('\n')}`);
    return finish(EXIT_CODES.ambiguousCommand);
  }

  return null;
};

const loadCommand = async function(script) {
  try {
    return await import(pathToFileURL(script));
  } catch (error) {
    console.error(`Failed to load command ${script}`, error);
    return null;
  }
};

const failedRequirements = async function(requirements) {
  const results = await Promise.allSettled(requirements.map((requirement) => requirement()));
  return results.filter((result) => result.status === 'rejected');
};

const parseCommandArgs = function(doc, argv) {
  try {
    const args = docopt(doc, {
      argv,
      exit: false,
      help: false,
    });
    return { args, status: 'ok' };
  } catch (error) {
    return error instanceof DocoptExit ? { status: 'usage' } : { error, status: 'invalid-doc' };
  }
};

const executeScript = async function(script, args, helpRequested) {
  const commandModule = await loadCommand(script);
  if (!commandModule) {
    return finish(EXIT_CODES.misconfigured);
  }

  const { doc, requirements = [], run: execute } = commandModule;

  if (typeof doc !== 'string' || typeof execute !== 'function') {
    console.error(`Command ${script} is not configured. It must export \`doc\` string and \`run\` function`);
    return finish(EXIT_CODES.misconfigured);
  }

  if (helpRequested) {
    console.log(doc.trim());
    return finish(EXIT_CODES.success);
  }

  const failures = await failedRequirements(requirements);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure.reason instanceof Error ? failure.reason.message : String(failure.reason));
    }
    return finish(EXIT_CODES.requirementsFailed);
  }

  const parsed = parseCommandArgs(doc, args);

  if (parsed.status === 'usage') {
    console.error(doc.trim());
    return finish(EXIT_CODES.usageError);
  }

  if (parsed.status === 'invalid-doc') {
    console.error(`Invalid docopt string in ${script}`, parsed.error);
    return finish(EXIT_CODES.misconfigured);
  }

  try {
    await execute(parsed.args);
    return finish(process.exitCode ?? EXIT_CODES.success);
  } catch (error) {
    console.error(`Error running command ${script}`, error);
    return finish(EXIT_CODES.runtimeError);
  }
};

export async function run(options) {
  const { name, commandsDir } = options;
  if (!name || !commandsDir) {
    throw new TypeError('run() requires `name` and `commandsDir` options');
  }

  const argv = options.argv ?? process.argv.slice(2);
  const dir = commandsDir instanceof URL ? fileURLToPath(commandsDir) : commandsDir;

  if (!isDirectory(dir)) {
    console.error(`Commands directory not found: ${dir}`);
    return finish(EXIT_CODES.misconfigured);
  }

  if (argv[0] === '--version' || argv[0] === '-V') {
    if (options.version) {
      console.log(options.version);
      return finish(EXIT_CODES.success);
    }
    console.error(`${name}: version not configured`);
    return finish(EXIT_CODES.commandNotFound);
  }

  const helpRequested = argv.includes('--help') || argv.includes('-h');
  const params = argv.filter((param) => param !== '--help' && param !== '-h');

  const resolution = resolveCommand(dir, params);
  if (resolution.type === 'not-found' && resolution.name === 'completion' && params[0] === 'completion') {
    return runCompletionBuiltin(name, params, helpRequested);
  }

  const handled = handleResolution(resolution);
  if (handled !== null) {
    return handled;
  }

  return executeScript(resolution.script, resolution.args, helpRequested);
}
