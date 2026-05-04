import { PrismaClient, TransactionType, TransactionSource, TransactionFlow } from '@prisma/client';
import prisma from '../client';

interface CreateTransactionDTO {
  accountId: number;
  totalValue?: number; // Optional, might be updated later via context
  type: TransactionType;
  flow?: TransactionFlow;
  context?: string;
  source?: TransactionSource;
}

export class TransactionService {
  async createTransaction(data: CreateTransactionDTO) {
    return prisma.transaction.create({
      data: {
        accountId: data.accountId,
        totalValue: data.totalValue || 0,
        type: data.type,
        flow: data.flow || "OUT",
        context: data.context || null,
        status: data.context ? "COMPLETED" : "PENDING_CONTEXT",
        source: data.source || "MANUAL"
      }
    });
  }

  async createBulkTransactions(data: CreateTransactionDTO[]) {
    const transactions = data.map(tx => ({
      accountId: tx.accountId,
      totalValue: tx.totalValue || 0,
      type: tx.type,
      flow: tx.flow || "OUT",
      context: tx.context || null,
      status: tx.context ? "COMPLETED" : "PENDING_CONTEXT",
      source: tx.source || "MANUAL"
    }));

    return prisma.transaction.createMany({
      data: transactions
    });
  }

  async getAccountTransactions(accountId: number, userId: number) {
    // First verify account ownership
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new Error('Cuenta no encontrada o no autorizada');
    }

    return prisma.transaction.findMany({
      where: { accountId },
      orderBy: { date: 'desc' },
      include: { media: true, items: true, account: { select: { symbol: true } } } // Include media, items and account symbol
    });
  }

  async getTransactionById(id: number, userId: number) {
    return prisma.transaction.findFirst({
      where: { 
        id,
        account: { userId }
      },
      include: { media: true, items: true, account: { select: { symbol: true } } }
    });
  }

  // New method to handle media attachment
  async addMedia(transactionId: number, fileUrl: string, fileType: string) {
    return prisma.transactionMedia.create({
      data: {
        transactionId,
        url: fileUrl,
        type: fileType
      }
    });
  }
}
