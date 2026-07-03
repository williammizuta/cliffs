export const requirements = [
  async function() {
    if (!process.env.HOME) {
      throw new Error('HOME environment variable is not set');
    }
  },
];

export const doc = `
Multiply two numbers
Usage:
  multiply <a> <b>
`;

export function run(args) {
  console.log(Number(args['<a>']) * Number(args['<b>']));
}
