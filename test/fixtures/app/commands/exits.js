const CUSTOM_EXIT_CODE = 7;

export const doc = `
Usage:
  exits
`;

export const run = (_args) => {
  process.exitCode = CUSTOM_EXIT_CODE;
};
