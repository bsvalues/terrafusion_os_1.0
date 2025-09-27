// Government test setup
process.env.NODE_ENV = 'test';
process.env.GOVERNMENT_MODE = 'true';

beforeAll(() => {
  console.log('🏛️  Government compliance test mode enabled');
});
