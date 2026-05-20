import request from 'supertest';
import app from "../app";
import { prismaMock } from "../singleton";

// Mock axios so we don't make real network requests in tests
jest.mock('axios', () => {
  return {
    get: jest.fn().mockImplementation((url: string) => {
      if (url.includes('coingecko')) {
        return Promise.resolve({ data: { bitcoin: { usd: 43000 } } });
      }
      if (url.includes('dolarapi.com')) {
        return Promise.resolve({ data: { promedio: 36.25 } });
      }
      return Promise.resolve({ data: {} });
    }),
    post: jest.fn().mockImplementation((url: string) => {
      if (url.includes('binance')) {
        return Promise.resolve({ 
          data: { 
            data: [
              { adv: { price: "45.00" } }, // Index 0 (Promoted Ad)
              { adv: { price: "43.50" } }  // Index 1 (Organic Ad)
            ] 
          } 
        });
      }
      return Promise.resolve({ data: {} });
    })
  };
});

describe('PriceController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/prices/:symbol should return price history', async () => {
    const mockHistory = [
      { id: 1, symbol: 'BTC-USD', provider: 'Mock', price: 40000, date: new Date('2026-01-01') },
      { id: 2, symbol: 'BTC-USD', provider: 'Mock', price: 42000, date: new Date('2026-01-02') }
    ];

    prismaMock.dailyPrice.findMany.mockResolvedValue(mockHistory);

    const response = await request(app).get('/api/prices/BTC-USD');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].price).toBe(40000);
  });

  it('POST /api/prices/:symbol/fetch should fetch and store current price with default provider', async () => {
    const mockPriceRecord = {
      id: 3,
      symbol: 'BTC-USD',
      provider: 'Mock',
      price: 42000.50,
      date: new Date()
    };

    // Upsert resolves with the created/updated record
    prismaMock.dailyPrice.upsert.mockResolvedValue(mockPriceRecord);

    const response = await request(app).post('/api/prices/BTC-USD/fetch');

    expect(response.status).toBe(200);
    expect(response.body.price).toBe(42000.50);
  });

  it('POST /api/prices/:symbol/fetch should fetch from specified provider', async () => {
    const mockPriceRecord = {
      id: 4,
      symbol: 'BTC-USD',
      provider: 'CoinGecko',
      price: 43000,
      date: new Date()
    };

    prismaMock.dailyPrice.upsert.mockResolvedValue(mockPriceRecord);

    const response = await request(app).post('/api/prices/BTC-USD/fetch?provider=CoinGecko');

    expect(response.status).toBe(200);
    expect(response.body.price).toBe(43000);
    expect(response.body.provider).toBe('CoinGecko');
  });

  it('POST /api/prices/:symbol/fetch should fetch from BCV provider', async () => {
    const mockPriceRecord = {
      id: 5,
      symbol: 'USDT-VES',
      provider: 'BCV',
      price: 36.25,
      date: new Date()
    };

    prismaMock.dailyPrice.upsert.mockResolvedValue(mockPriceRecord);

    const response = await request(app).post('/api/prices/USDT-VES/fetch?provider=BCV');

    expect(response.status).toBe(200);
    expect(response.body.price).toBe(36.25);
    expect(response.body.provider).toBe('BCV');
  });

  it('POST /api/prices/:symbol/fetch should fetch from Binance P2P provider', async () => {
    const mockPriceRecord = {
      id: 6,
      symbol: 'USDT-VES',
      provider: 'Binance',
      price: 43.50,
      date: new Date()
    };

    prismaMock.dailyPrice.upsert.mockResolvedValue(mockPriceRecord);

    const response = await request(app).post('/api/prices/USDT-VES/fetch?provider=Binance');

    expect(response.status).toBe(200);
    expect(response.body.price).toBe(43.50);
    expect(response.body.provider).toBe('Binance');
  });
});
