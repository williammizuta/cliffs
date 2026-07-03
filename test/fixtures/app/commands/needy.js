export const requirements = [
  async function() {
    throw new Error('THE_DEPENDENCY is not installed');
  },
];

export const doc = `
Usage:
  needy
`;

export function run(_args) {
  console.log('should never run');
}
