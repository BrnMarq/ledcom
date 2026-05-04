import { TransactionType, TransactionSource, TransactionFlow } from '@prisma/client';
import { TransactionService } from './TransactionService';
import { prismaMock } from '../singleton';

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
  });

  it('should create a transaction with context and set status COMPLETED', async () => {
    const newTxData = {
      accountId: 1,
      totalValue: 50000,
      type: "SAVINGS" as TransactionType,
      flow: "OUT" as TransactionFlow,
      context: 'Bought the dip',
      source: "MANUAL" as TransactionSource
    };

    prismaMock.transaction.create.mockResolvedValue({ id: 1, ...newTxData, status: 'COMPLETED', date: new Date() } as any);

    const result = await transactionService.createTransaction(newTxData);

    expect(prismaMock.transaction.create).toHaveBeenCalledWith({
      data: {
        accountId: 1,
        totalValue: 50000,
        type: 'SAVINGS',
        flow: 'OUT',
        context: 'Bought the dip',
        status: 'COMPLETED',
        source: 'MANUAL'
      }
    });
    expect(result.status).toBe('COMPLETED');
  });

  it('should create a transaction without context and set status PENDING_CONTEXT', async () => {
    const newTxData = {
      accountId: 1,
      totalValue: 25000,
      type: "SAVINGS" as TransactionType,
      flow: "OUT" as TransactionFlow,
      source: "BOT" as TransactionSource
    };

    prismaMock.transaction.create.mockResolvedValue({ id: 2, ...newTxData, context: null, status: 'PENDING_CONTEXT', date: new Date() } as any);

    const result = await transactionService.createTransaction(newTxData);

    expect(prismaMock.transaction.create).toHaveBeenCalledWith({
      data: {
        accountId: 1,
        totalValue: 25000,
        type: 'SAVINGS',
        flow: 'OUT',
        context: null,
        status: 'PENDING_CONTEXT',
        source: 'BOT'
      }
    });
    expect(result.status).toBe('PENDING_CONTEXT');
  });
});
