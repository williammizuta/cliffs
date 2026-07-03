export const requirements = [
  () => {
    throw new Error('THE_DEPENDENCY is not installed');
  },
];

export const doc = `
Usage:
  needy
`;

export const run = (_args) => {
  console.log('should never run');
};
