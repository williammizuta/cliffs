export type Shell = 'bash' | 'zsh';

export type RunOptions = {
  /** Binary name, used in completion scripts and error messages. */
  name: string;
  /** Directory holding the command tree, as a path or file:// URL. */
  commandsDir: string | URL;
  /** Arguments to route. Defaults to process.argv.slice(2). */
  argv?: string[];
  /** When provided, `--version`/`-V` prints it and exits 0. */
  version?: string;
};

export type CommandResolution =
  | { type: 'command'; script: string; args: string[] }
  | { type: 'list'; commands: string[] }
  | { type: 'not-found'; name: string }
  | { type: 'ambiguous'; name: string; candidates: string[] };

export declare const EXIT_CODES: {
  readonly success: 0;
  readonly commandNotFound: 1;
  readonly ambiguousCommand: 2;
  readonly misconfigured: 3;
  readonly requirementsFailed: 4;
  readonly runtimeError: 5;
  readonly usageError: 64;
};

export declare const SUPPORTED_SHELLS: readonly Shell[];

/** Resolve and execute a command. Sets process.exitCode and returns it. */
export declare function run(options: RunOptions): Promise<number>;

/** Returns the bash or zsh completion script for a CLI named `name`. */
export declare function completionScript(name: string, shell: Shell): string;

/** The pure routing step: walk `commandsDir` consuming `argv`, without executing anything. */
export declare function resolveCommand(commandsDir: string, argv: string[]): CommandResolution;

/** The command names available in a directory, sorted alphabetically. */
export declare function listCommands(dir: string): string[];
