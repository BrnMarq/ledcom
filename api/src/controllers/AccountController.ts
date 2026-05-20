import { Response } from 'express';
import { AuthRequest } from "../middleware/auth";
import prisma from "../client";

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
        res.json(accounts);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
  }
}
