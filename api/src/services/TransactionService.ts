import prisma from "../client";
import { TransactionType, TransactionFlow } from "@prisma/client";

export interface UpdateTransactionData {
  totalValue?: number;
  type?: TransactionType;
  flow?: TransactionFlow;
  context?: string;
  items?: {
    id?: number;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export class TransactionService {
  async getAccountTransactions(accountId: number, userId: number) {
    // First verify account ownership
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error("Cuenta no encontrada o no autorizada");
    }

    return prisma.transaction.findMany({
      where: { accountId },
      orderBy: { date: "desc" },
      include: {
        media: true,
        items: true,
        account: { select: { symbol: true } },
      }, // Include media, items and account symbol
    });
  }

  async getTransactionById(id: number, userId: number) {
    return prisma.transaction.findFirst({
      where: {
        id,
        account: { userId },
      },
      include: {
        media: true,
        items: true,
        account: { select: { symbol: true } },
      },
    });
  }

  async updateTransaction(id: number, userId: number, data: UpdateTransactionData) {
    const existing = await prisma.transaction.findFirst({
      where: { id, account: { userId } },
    });

    if (!existing) {
      throw new Error("Transacción no encontrada o no autorizada");
    }

    let itemsUpdate = undefined;
    if (data.items) {
      const itemIdsToKeep = data.items.filter(i => i.id).map(i => i.id as number);
      
      itemsUpdate = {
        deleteMany: {
          id: { notIn: itemIdsToKeep }
        },
        upsert: data.items.filter(i => i.id).map(item => ({
          where: { id: item.id },
          update: { name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice },
          create: { name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice }
        })),
        create: data.items.filter(i => !i.id).map(item => ({
          name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice
        }))
      };
    }

    return prisma.transaction.update({
      where: { id },
      data: {
        totalValue: data.totalValue,
        type: data.type,
        flow: data.flow,
        context: data.context,
        items: itemsUpdate
      },
      include: {
        media: true,
        items: true,
        account: { select: { symbol: true } },
      }
    });
  }
}
