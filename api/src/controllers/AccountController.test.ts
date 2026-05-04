import request from 'supertest';
import app from '../app';
import { prismaMock } from '../singleton';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');

describe('AccountController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/accounts should create an account', async () => {
    const mockAccount = { id: 1, userId: 1, name: 'Test Portfolio', symbol: 'USD', createdAt: new Date() };
    prismaMock.account.create.mockResolvedValue(mockAccount);

    const response = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Portfolio' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ...mockAccount,
      createdAt: mockAccount.createdAt.toISOString()
    });
  });

  it('GET /api/accounts should return all accounts', async () => {
    const mockAccounts = [
      { id: 1, userId: 1, name: 'Main Account', symbol: 'USD', createdAt: new Date() },
      { id: 2, userId: 1, name: 'Savings Account', symbol: 'USD', createdAt: new Date() }
    ];
    prismaMock.account.findMany.mockResolvedValue(mockAccounts);

    const response = await request(app).get('/api/accounts').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toBe('Main Account');
  });
});
