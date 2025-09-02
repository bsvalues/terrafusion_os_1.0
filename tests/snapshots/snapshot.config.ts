export const snapshotConfig = {
  resolvers: {
    visual: 'tests/__snapshots__/visual',
    dom: 'tests/__snapshots__/dom',
    data: 'tests/__snapshots__/contracts'
  },
  updateStrategy: process.env.CI ? 'fail' : 'interactive',
  diffThreshold: 0.01
};