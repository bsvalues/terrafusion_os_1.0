/**
 * Network Mock for Testing
 */

export const NetworkMock = {
  httpRequest: jest.fn().mockResolvedValue({ status: 200, data: {} }),
  websocketConnect: jest.fn().mockResolvedValue({ connected: true }),
  websocketSend: jest.fn().mockResolvedValue({ sent: true }),
  websocketClose: jest.fn().mockResolvedValue({ closed: true }),
};

export default NetworkMock;
