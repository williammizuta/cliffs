export const doc = `
Add two numbers
Usage:
  add <a> <b>
`;

export function run(args) {
  console.log(Number(args['<a>']) + Number(args['<b>']));
}
