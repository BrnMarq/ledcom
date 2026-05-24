import prisma from "@/client";
import { TransactionType, TransactionFlow } from "@prisma/client";
import { calculateUnitPrice, calculateTransactionTotal } from "@/utils/calculations";

export interface CreateTransactionData {
  totalValue?: number;
  type: TransactionType;
  flow: TransactionFlow;
  context?: string;
  date?: string | Date;
  items?: {
    name: string;
    quantity: number;
    unitPrice?: number;
    totalPrice: number;
  }[];
}

export interface UpdateTransactionData {
  totalValue?: number;
  type?: TransactionType;
  flow?: TransactionFlow;
  context?: string;
  items?: {
    id?: number;
    name: string;
    quantity: number;
    unitPrice?: number;
    totalPrice: number;
  }[];
}

export class TransactionService {
  async createTransaction(userId: number, accountId: number, data: CreateTransactionData) {
    if (!data.items || data.items.length === 0) {
      throw new Error("La transacción debe tener al menos un artículo.");
    }

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error("Cuenta no encontrada o no autorizada");
    }

    const processedItems = data.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      unitPrice: item.unitPrice ?? calculateUnitPrice(item.totalPrice, item.quantity)
    }));

    const finalTotalValue = calculateTransactionTotal(processedItems);

    const transactionDate = data.date ? new Date(data.date) : new Date();

    return prisma.transaction.create({
      data: {
        accountId,
        totalValue: finalTotalValue,
        type: data.type,
        flow: data.flow,
        context: data.context,
        date: transactionDate,
        status: "COMPLETED",
        source: "MANUAL",
        items: {
          create: processedItems
        }
      },
      include: {
        items: true,
        media: true,
        account: { select: { symbol: true } },
      }
    });
  }

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
    if (!data.items || data.items.length === 0) {
      throw new Error("La transacción debe tener al menos un artículo.");
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, account: { userId } },
    });

    if (!existing) {
      throw new Error("Transacción no encontrada o no autorizada");
    }

    const itemIdsToKeep = data.items.filter(i => i.id).map(i => i.id as number);
    
    const processedItems = data.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      unitPrice: item.unitPrice ?? calculateUnitPrice(item.totalPrice, item.quantity)
    }));

    // Override the total value from frontend with our backend calculation
    const finalTotalValue = calculateTransactionTotal(processedItems);

    const itemsUpdate = {
      deleteMany: {
        id: { notIn: itemIdsToKeep }
      },
      upsert: processedItems.filter(i => i.id).map(item => ({
        where: { id: item.id },
        update: { name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice },
        create: { name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice }
      })),
      create: processedItems.filter(i => !i.id).map(item => ({
        name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice
      }))
    };

    return prisma.transaction.update({
      where: { id },
      data: {
        totalValue: finalTotalValue,
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
