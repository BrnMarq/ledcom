import { TransactionService } from "@/services/TransactionService";
import { prismaMock } from "@/singleton";

describe("TransactionService", () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(transactionService).toBeDefined();
  });

  describe("getAccountTransactions", () => {
    it("should return transactions for an account if authorized", async () => {
      const accountId = 1;
      const userId = 10;
      
      const mockAccount = { id: accountId, userId, name: "Test Account", symbol: "USD", createdAt: new Date() };
      const mockTransactions = [
        { id: 101, accountId, totalValue: 50, type: "WANTS", flow: "OUT", date: new Date(), status: "COMPLETED", context: "", media: [], items: [], account: { symbol: "USD" } }
      ];

      prismaMock.account.findFirst.mockResolvedValue(mockAccount as any);
      prismaMock.transaction.findMany.mockResolvedValue(mockTransactions as any);

      const result = await transactionService.getAccountTransactions(accountId, userId);

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId }
      });
      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: { accountId },
        orderBy: { date: "desc" },
        include: { media: true, items: true, account: { select: { symbol: true } } },
      });
      expect(result).toEqual(mockTransactions);
    });

    it("should throw an error if account is not found or not authorized", async () => {
      const accountId = 1;
      const userId = 10;

      prismaMock.account.findFirst.mockResolvedValue(null);

      await expect(transactionService.getAccountTransactions(accountId, userId)).rejects.toThrow("Cuenta no encontrada o no autorizada");
      
      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId }
      });
      expect(prismaMock.transaction.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getTransactionById", () => {
    it("should return a transaction by id if it belongs to the user", async () => {
      const transactionId = 101;
      const userId = 10;
      
      const mockTransaction = { id: transactionId, accountId: 1, totalValue: 50, type: "WANTS", flow: "OUT", date: new Date(), status: "COMPLETED", context: "", media: [], items: [], account: { symbol: "USD" } };

      prismaMock.transaction.findFirst.mockResolvedValue(mockTransaction as any);

      const result = await transactionService.getTransactionById(transactionId, userId);

      expect(prismaMock.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: transactionId,
          account: { userId }
        },
        include: {
          media: true,
          items: true,
          account: { select: { symbol: true } }
        }
      });
      expect(result).toEqual(mockTransaction);
    });
  });

  describe("updateTransaction", () => {
    it("should update a transaction and its items if authorized", async () => {
      const transactionId = 101;
      const userId = 10;
      const data = {
        totalValue: 60,
        items: [{ id: 1, name: "Apple", quantity: 1, unitPrice: 10, totalPrice: 10 }, { name: "Orange", quantity: 1, unitPrice: 50, totalPrice: 50 }]
      };

      const mockTransaction = { id: transactionId, accountId: 1, totalValue: 50, type: "WANTS", flow: "OUT", date: new Date(), status: "COMPLETED", context: "", media: [], items: [], account: { symbol: "USD" } };

      prismaMock.transaction.findFirst.mockResolvedValue(mockTransaction as any);
      prismaMock.transaction.update.mockResolvedValue({ ...mockTransaction, totalValue: 60 } as any);

      const result = await transactionService.updateTransaction(transactionId, userId, data as any);

      expect(prismaMock.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: transactionId, account: { userId } }
      });
      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: expect.objectContaining({
          totalValue: 60,
          items: expect.objectContaining({
            deleteMany: { id: { notIn: [1] } },
            upsert: expect.any(Array),
            create: expect.any(Array)
          })
        }),
        include: expect.any(Object)
      });
      expect(result.totalValue).toBe(60);
    });

    it("should throw an error if transaction items are missing", async () => {
      const transactionId = 101;
      const userId = 10;

      await expect(transactionService.updateTransaction(transactionId, userId, {})).rejects.toThrow("La transacción debe tener al menos un artículo.");
    });

    it("should throw an error if transaction not found or not authorized to update", async () => {
      const transactionId = 101;
      const userId = 10;
      const data = {
        items: [{ name: "Test", quantity: 1, totalPrice: 10 }]
      };

      prismaMock.transaction.findFirst.mockResolvedValue(null);

      await expect(transactionService.updateTransaction(transactionId, userId, data as any)).rejects.toThrow("Transacción no encontrada o no autorizada");
    });
  });
});
