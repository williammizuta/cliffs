export const doc = `
Say hello
Usage:
  hello [<name>] [--shout]

Options:
  --shout  Print the greeting in uppercase
`;

export const run = (args) => {
  const greeting = `Hello, ${args['<name>'] || 'world'}!`;
  console.log(args['--shout'] ? greeting.toUpperCase() : greeting);
};
