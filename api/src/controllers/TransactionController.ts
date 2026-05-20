import { Response } from "express";
import { TransactionService } from "@/services/TransactionService";
import { ContextService } from "@/services/ContextService";
import { AuthRequest } from "@/middleware/auth";
import prisma from "@/client";

const transactionService = new TransactionService();
const contextService = new ContextService();

export class TransactionController {
  async createFromMedia(req: AuthRequest, res: Response) {
    try {
      const accountId = parseInt(req.body.accountId as string);
      const userId = req.userId!;
      const file = req.file;

      if (isNaN(accountId)) {
        res.status(400).json({ error: "Valid accountId is required" });
        return;
      }

      // Check account ownership
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });

      if (!account) {
        res.status(403).json({ error: "No autorizado para esta cuenta" });
        return;
      }

      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const type = file.mimetype.startsWith("audio/") ? "AUDIO" : "IMAGE";

      const transaction = await contextService.createTransactionFromMedia(
        accountId,
        file.path,
        type,
        account.symbol,
      );

      res.status(201).json({
        message: "Transaction created successfully from media.",
        transaction,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByAccount(req: AuthRequest, res: Response) {
    try {
      const accountId = parseInt(req.params.id as string);
      const userId = req.userId!;
      const transactions = await transactionService.getAccountTransactions(
        accountId,
        userId,
      );
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.userId!;
      const transaction = await transactionService.getTransactionById(
        id,
        userId,
      );
      if (!transaction) {
        res
          .status(404)
          .json({ error: "Transaction not found or unauthorized" });
        return;
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.userId!;
      const data = req.body;

      const updatedTransaction = await transactionService.updateTransaction(
        id,
        userId,
        data,
      );

      res.json(updatedTransaction);
    } catch (error: any) {
      if (error.message === "Transacción no encontrada o no autorizada") {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
