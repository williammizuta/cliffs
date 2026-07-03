export type Shell = 'bash' | 'zsh';

export type RunOptions = {
  name: string;
  commandsDir: string | URL;
  argv?: string[];
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

export declare const SUPPORTED_SHELLS: Shell[];

export declare function run(options: RunOptions): Promise<number>;

export declare function completionScript(name: string, shell: Shell): string;

export declare function resolveCommand(commandsDir: string, argv: string[]): CommandResolution;

export declare function listCommands(dir: string): string[];
