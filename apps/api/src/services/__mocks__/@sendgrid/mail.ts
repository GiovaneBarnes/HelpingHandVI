const mockSendGrid = {
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue(undefined)
};

module.exports = {
  default: mockSendGrid
};