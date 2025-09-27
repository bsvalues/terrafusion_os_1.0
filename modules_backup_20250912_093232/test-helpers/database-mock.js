/**
 * Database Mock for Testing
 */

export const DatabaseMock = {
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  query: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockResolvedValue({ id: 1 }),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  delete: jest.fn().mockResolvedValue({ deleted: 1 }),
  cleanup: jest.fn().mockResolvedValue(true),
};

export default DatabaseMock;
