import {
  TransactionType,
  TransactionSource,
  TransactionFlow,
} from "@prisma/client";
import { TransactionService } from "./TransactionService";
import { prismaMock } from "../singleton";

describe("TransactionService", () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
  });

  it("should be defined", () => {
    expect(transactionService).toBeDefined();
  });
});
