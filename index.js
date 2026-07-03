import { DocoptExit, docopt } from 'docopt';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { completionScript } from './lib/completion.js';
import { resolveCommand } from './lib/router.js';
import { statSync } from 'node:fs';

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

const finish = (code) => {
  process.exitCode = code;
  return code;
};

const isDirectory = (path) => {
  try {
    return statSync(path).isDirectory();
  } catch (_error) {
    return false;
  }
};

const printList = (commands) => {
  if (commands.length === 0) {
    console.log('No commands found');
    return;
  }
  console.log(`Available commands:\n${commands.map((command) => ` - ${command}`).join('\n')}`);
};

const runCompletionBuiltin = (name, params, helpRequested) => {
  const usage = `Usage: ${name} completion (bash|zsh)`;
  if (helpRequested) {
    console.log(usage);
    return finish(EXIT_CODES.success);
  }

  const [, shell] = params;
  if (shell === 'bash' || shell === 'zsh') {
    process.stdout.write(completionScript(name, shell));
    return finish(EXIT_CODES.success);
  }
  console.error(usage);
  return finish(EXIT_CODES.usageError);
};

const handleResolution = (resolution) => {
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

const loadCommand = async (script) => {
  try {
    return await import(pathToFileURL(script));
  } catch (error) {
    console.error(`Failed to load command ${script}`, error);
    return null;
  }
};

const loadValidCommand = async (script) => {
  const commandModule = await loadCommand(script);
  if (!commandModule) {
    return null;
  }

  const { doc, run: execute } = commandModule;
  if (typeof doc !== 'string' || typeof execute !== 'function') {
    console.error(`Command ${script} is not configured. It must export \`doc\` string and \`run\` function`);
    return null;
  }
  return commandModule;
};

const reportFailedRequirements = async (requirements) => {
  const results = await Promise.allSettled(requirements.map(async (requirement) => await requirement()));
  const failures = results.filter((result) => result.status === 'rejected');
  for (const failure of failures) {
    console.error(failure.reason instanceof Error ? failure.reason.message : String(failure.reason));
  }
  return failures.length > 0;
};

const parseCommandArgs = (doc, argv) => {
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

const runCommand = async (script, execute, args) => {
  try {
    await execute(args);
    return finish(process.exitCode ?? EXIT_CODES.success);
  } catch (error) {
    console.error(`Error running command ${script}`, error);
    return finish(EXIT_CODES.runtimeError);
  }
};

const parseAndRun = (script, { args, doc, execute }) => {
  const parsed = parseCommandArgs(doc, args);

  if (parsed.status === 'usage') {
    console.error(doc.trim());
    return finish(EXIT_CODES.usageError);
  }

  if (parsed.status === 'invalid-doc') {
    console.error(`Invalid docopt string in ${script}`, parsed.error);
    return finish(EXIT_CODES.misconfigured);
  }

  return runCommand(script, execute, parsed.args);
};

const executeScript = async (script, args, helpRequested) => {
  const commandModule = await loadValidCommand(script);
  if (!commandModule) {
    return finish(EXIT_CODES.misconfigured);
  }

  const { doc, requirements = [], run: execute } = commandModule;

  if (helpRequested) {
    console.log(doc.trim());
    return finish(EXIT_CODES.success);
  }

  if (await reportFailedRequirements(requirements)) {
    return finish(EXIT_CODES.requirementsFailed);
  }

  return parseAndRun(script, { args, doc, execute });
};

const printVersion = (version, name) => {
  if (version) {
    console.log(version);
    return finish(EXIT_CODES.success);
  }
  console.error(`${name}: version not configured`);
  return finish(EXIT_CODES.commandNotFound);
};

const dispatch = (dir, name, argv) => {
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
};

const commandsPath = ({ commandsDir, name }) => {
  if (!name || !commandsDir) {
    throw new TypeError('run() requires `name` and `commandsDir` options');
  }
  return commandsDir instanceof URL ? fileURLToPath(commandsDir) : commandsDir;
};

export const run = async (options) => {
  const dir = commandsPath(options);
  if (!isDirectory(dir)) {
    console.error(`Commands directory not found: ${dir}`);
    return finish(EXIT_CODES.misconfigured);
  }

  const argv = options.argv ?? process.argv.slice(2);
  if (argv[0] === '--version' || argv[0] === '-V') {
    return printVersion(options.version, options.name);
  }

  return await dispatch(dir, options.name, argv);
};
