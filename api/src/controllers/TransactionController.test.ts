import request from 'supertest';
import app from '../app';
import { prismaMock } from '../singleton';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');

import { TransactionType, TransactionSource, TransactionFlow } from '@prisma/client';

// We need to mock the ContextService as it uses setTimeout and is async
jest.mock('../services/ContextService', () => {
  return {
    ContextService: jest.fn().mockImplementation(() => {
      return {
        processMedia: jest.fn().mockResolvedValue(undefined),
        createTransactionFromMedia: jest.fn().mockResolvedValue({
          id: 2,
          accountId: 1,
          symbol: "USD",
          totalValue: 500,
          type: "NEEDS",
          flow: "OUT",
          context: "Mock Context",
          status: "COMPLETED",
          source: "MANUAL",
          items: [],
          media: []
        })
      };
    })
  };
});

describe('TransactionController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/transactions should create a BOT transaction without context', async () => {
    const mockTx = {
      id: 1,
      accountId: 1,
      symbol: 'BTC-USD',
      totalValue: 50000,
      type: "SAVINGS" as TransactionType,
      flow: "OUT" as TransactionFlow,
      context: null,
      status: 'PENDING_CONTEXT',
      source: "BOT" as TransactionSource,
      date: new Date()
    };

    prismaMock.account.findFirst.mockResolvedValue({ id: 1, userId: 1, name: 'Mock Account', createdAt: new Date() });
    prismaMock.transaction.create.mockResolvedValue(mockTx);

    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ accountId: 1, symbol: 'BTC-USD', totalValue: 50000, type: 'SAVINGS', source: 'BOT' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDING_CONTEXT');
  });

  it('POST /api/transactions/bulk should create multiple transactions', async () => {
    const mockTxs = [
      { accountId: 1, symbol: 'BTC-USD', totalValue: 50000, type: 'SAVINGS', flow: 'OUT', source: 'BOT' },
      { accountId: 1, symbol: 'ETH-USD', totalValue: 2500, type: 'SAVINGS', flow: 'OUT', source: 'BOT' }
    ];

    prismaMock.account.findMany.mockResolvedValue([{ id: 1, userId: 1, name: 'Mock Account', createdAt: new Date() }]);
    prismaMock.transaction.createMany.mockResolvedValue({ count: 2 });

    const response = await request(app)
      .post('/api/transactions/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send(mockTxs);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Transactions successfully imported.');
    expect(response.body.count).toBe(2);
  });

  it('POST /api/transactions/:id/context should accept media upload', async () => {
    const mockTx = {
      id: 1,
      accountId: 1,
      symbol: 'BTC-USD',
      totalValue: 50000,
      type: "SAVINGS" as TransactionType,
      flow: "OUT" as TransactionFlow,
      context: null,
      status: 'PENDING_CONTEXT',
      source: "BOT" as TransactionSource,
      date: new Date()
    };
    const mockMedia = {
      id: 1,
      url: '/uploads/dummy.jpg',
      type: 'IMAGE',
      transactionId: 1,
      createdAt: new Date()
    };

    prismaMock.transaction.findFirst.mockResolvedValue(mockTx as any);
    prismaMock.transactionMedia.create.mockResolvedValue(mockMedia);

    // Using supertest's attach to simulate a file upload
    const response = await request(app)
      .post('/api/transactions/1/context')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake image data'), 'test.jpg');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Media uploaded successfully. Context processing started and completed.');
    expect(response.body).toHaveProperty('mediaId', 1);
  });

  it('POST /api/transactions/from-media should create a transaction from media upload', async () => {
    prismaMock.account.findFirst.mockResolvedValue({ id: 1, userId: 1, name: 'Mock Account', createdAt: new Date() });
    const response = await request(app)
      .post('/api/transactions/from-media')
      .set('Authorization', `Bearer ${token}`)
      .field('accountId', '1')
      .field('symbol', 'USD')
      .attach('file', Buffer.from('fake audio data'), 'test.mp3');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Transaction created successfully from media.');
    expect(response.body.transaction).toHaveProperty('id', 2);
    expect(response.body.transaction).toHaveProperty('status', 'COMPLETED');
  });
});
