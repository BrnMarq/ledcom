import { TransactionService } from "./TransactionService";
import { prismaMock } from "../singleton";

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
});
