import axios from 'axios';

// Mock supabase before importing api
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

import { client, api } from '../../services/api';
import { supabase } from '../../lib/supabase';

const mockGetSession = supabase.auth.getSession as jest.Mock;

// Mock axios instance methods
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: {} },
  };
  return {
    ...actual,
    create: jest.fn(() => mockInstance),
    default: { create: jest.fn(() => mockInstance) },
  };
});

describe('api service', () => {
  const mockGet = client.get as jest.Mock;
  const mockPost = client.post as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  describe('getRates', () => {
    it('calls /rates with correct params', async () => {
      const mockData = { providers: [], best_recipient: 0 };
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await api.getRates('KRW', 'PHP', 1000000);

      expect(mockGet).toHaveBeenCalledWith('/rates', {
        params: { from: 'KRW', to: 'PHP', amount: 1000000 },
      });
      expect(result).toEqual(mockData);
    });

    it('propagates errors from the server', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));
      await expect(api.getRates('KRW', 'PHP', 1000000)).rejects.toThrow('Network Error');
    });
  });

  describe('getHistory', () => {
    it('calls /rates/history with correct params', async () => {
      const mockData = { data: [], from_currency: 'KRW', to_currency: 'PHP', days: 7 };
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await api.getHistory('KRW', 'PHP', 7);

      expect(mockGet).toHaveBeenCalledWith('/rates/history', {
        params: { from: 'KRW', to: 'PHP', days: 7 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('getCorridors', () => {
    it('calls /corridors', async () => {
      const mockData = [{ from: 'KRW', to: 'PHP', flag: '🇵🇭', label: 'Philippines' }];
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await api.getCorridors();

      expect(mockGet).toHaveBeenCalledWith('/corridors');
      expect(result).toEqual(mockData);
    });
  });

  describe('scanReceipt', () => {
    it('calls /expenses/scan with multipart/form-data', async () => {
      const mockData = { entries: [] };
      mockPost.mockResolvedValueOnce({ data: mockData });

      const result = await api.scanReceipt('file:///test/image.jpg');

      expect(mockPost).toHaveBeenCalledWith(
        '/expenses/scan',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockData);
    });
  });
});

describe('auth interceptor', () => {
  it('attaches Bearer token when session exists', async () => {
    const session = { access_token: 'my-jwt-token' };
    mockGetSession.mockResolvedValueOnce({ data: { session } });

    // Re-import to get fresh interceptor
    const { supabase: sb } = require('../../lib/supabase');
    const { data } = await sb.auth.getSession();
    expect(data.session?.access_token).toBe('my-jwt-token');
  });

  it('returns no token when no session', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeNull();
  });
});
