import { Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { ContextService } from '../services/ContextService';
import { AuthRequest } from '../middleware/auth';
import prisma from '../client';

const transactionService = new TransactionService();
const contextService = new ContextService();

export class TransactionController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { accountId, totalValue, type, flow, context, source } = req.body;
      const userId = req.userId!;

      // Check account ownership
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId }
      });

      if (!account) {
        res.status(403).json({ error: 'No autorizado para esta cuenta' });
        return;
      }

      const transaction = await transactionService.createTransaction({
        accountId, totalValue, type, flow, context, source
      });
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createBulk(req: AuthRequest, res: Response) {
    try {
      const transactions = req.body;
      const userId = req.userId!;

      if (!Array.isArray(transactions)) {
        res.status(400).json({ error: 'Expected an array of transactions' });
        return;
      }

      // Verify account ownership
      const accountIds = Array.from(new Set(transactions.map((tx: any) => tx.accountId)));
      const accounts = await prisma.account.findMany({
        where: { id: { in: accountIds }, userId }
      });

      if (accounts.length !== accountIds.length) {
        res.status(403).json({ error: 'No autorizado para una o más cuentas' });
        return;
      }
      
      const result = await transactionService.createBulkTransactions(transactions);
      res.status(201).json({
        message: 'Transactions successfully imported.',
        count: result.count
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByAccount(req: AuthRequest, res: Response) {
    try {
      const accountId = parseInt(req.params.id as string);
      const userId = req.userId!;
      const transactions = await transactionService.getAccountTransactions(accountId, userId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.userId!;
      const transaction = await transactionService.getTransactionById(id, userId);
      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found or unauthorized' });
        return;
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addContextMedia(req: AuthRequest, res: Response) {
    try {
      const transactionId = parseInt(req.params.id as string);
      const userId = req.userId!;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Check transaction ownership
      const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, account: { userId } }
      });

      if (!transaction) {
        res.status(403).json({ error: 'No autorizado para esta transacción' });
        return;
      }

      // Determine type (simple logic for now)
      const type = file.mimetype.startsWith('audio/') ? 'AUDIO' : 'IMAGE';
      
      // Save Media Record
      const media = await transactionService.addMedia(transactionId, file.path, type);

      // Trigger Async Processing (Mock AI)
      await contextService.processMedia(media.id, transactionId);

      res.status(201).json({
        message: 'Media uploaded successfully. Context processing started and completed.',
        mediaId: media.id,
        status: 'COMPLETED'
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createFromMedia(req: AuthRequest, res: Response) {
    try {
      const accountId = parseInt(req.body.accountId as string);
      const userId = req.userId!;
      const file = req.file;

      if (isNaN(accountId)) {
        res.status(400).json({ error: 'Valid accountId is required' });
        return;
      }

      // Check account ownership
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId }
      });

      if (!account) {
        res.status(403).json({ error: 'No autorizado para esta cuenta' });
        return;
      }

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const type = file.mimetype.startsWith('audio/') ? 'AUDIO' : 'IMAGE';
      
      const transaction = await contextService.createTransactionFromMedia(accountId, file.path, type, account.symbol);

      res.status(201).json({
        message: 'Transaction created successfully from media.',
        transaction
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
