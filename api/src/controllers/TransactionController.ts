import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { ContextService } from '../services/ContextService';

const transactionService = new TransactionService();
const contextService = new ContextService();

export class TransactionController {
  async create(req: Request, res: Response) {
    try {
      const { accountId, symbol, totalValue, type, flow, context, source } = req.body;
      const transaction = await transactionService.createTransaction({
        accountId, symbol, totalValue, type, flow, context, source
      });
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createBulk(req: Request, res: Response) {
    try {
      const transactions = req.body;
      if (!Array.isArray(transactions)) {
        res.status(400).json({ error: 'Expected an array of transactions' });
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

  async getByAccount(req: Request, res: Response) {
    try {
      const accountId = parseInt(req.params.id as string);
      const transactions = await transactionService.getAccountTransactions(accountId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const transaction = await transactionService.getTransactionById(id);
      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addContextMedia(req: Request, res: Response) {
    try {
      const transactionId = parseInt(req.params.id as string);
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
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

  async createFromMedia(req: Request, res: Response) {
    try {
      const accountId = parseInt(req.body.accountId as string);
      const symbol = req.body.symbol as string || "USD";
      const file = req.file;

      if (isNaN(accountId)) {
        res.status(400).json({ error: 'Valid accountId is required' });
        return;
      }

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const type = file.mimetype.startsWith('audio/') ? 'AUDIO' : 'IMAGE';
      
      const transaction = await contextService.createTransactionFromMedia(accountId, file.path, type, symbol);

      res.status(201).json({
        message: 'Transaction created successfully from media.',
        transaction
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
