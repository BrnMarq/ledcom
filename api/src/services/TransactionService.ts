import { PrismaClient, TransactionType, TransactionSource, TransactionFlow } from '@prisma/client';
import prisma from '../client';

interface CreateTransactionDTO {
  accountId: number;
  symbol: string;
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
        symbol: data.symbol,
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
      symbol: tx.symbol,
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

  async getAccountTransactions(accountId: number) {
    return prisma.transaction.findMany({
      where: { accountId },
      orderBy: { date: 'desc' },
      include: { media: true, items: true } // Include media and items in results
    });
  }

  async getTransactionById(id: number) {
    return prisma.transaction.findUnique({
      where: { id },
      include: { media: true, items: true }
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
