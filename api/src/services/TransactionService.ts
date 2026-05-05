import prisma from "../client";

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
}
