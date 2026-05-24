import { Response } from 'express';
import { AuthRequest } from "@/middleware/auth";
import prisma from "@/client";
import { TransactionFlow } from '@prisma/client';

export class AccountController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, symbol } = req.body;
      const userId = req.userId!;
      
      const account = await prisma.account.create({
        data: { 
          name,
          symbol: symbol || 'USD',
          userId
        }
      });
      res.status(201).json(account);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Ya tienes una cuenta con ese nombre' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async getAll(req: AuthRequest, res: Response) {
      try {
        const userId = req.userId!;
        const accounts = await prisma.account.findMany({
          where: { userId }
        });

        const accountIds = accounts.map(a => a.id);

        const aggregations = await prisma.transaction.groupBy({
          by: ['accountId', 'flow'],
          where: {
            accountId: { in: accountIds }
          },
          _sum: {
            totalValue: true
          }
        });

        const accountsWithBalance = accounts.map(account => {
          let balance = 0;
          
          const accountAggs = aggregations.filter(agg => agg.accountId === account.id);
          
          for (const agg of accountAggs) {
             const sum = agg._sum.totalValue || 0;
             if (agg.flow === TransactionFlow.IN) {
                 balance += sum;
             } else if (agg.flow === TransactionFlow.OUT) {
                 balance -= sum;
             }
          }

          return {
            ...account,
            balance
          };
        });

        res.json(accountsWithBalance);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
  }
}
