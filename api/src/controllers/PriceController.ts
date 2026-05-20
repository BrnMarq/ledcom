import { Request, Response } from 'express';
import { PriceService } from "../services/PriceService";
import { MockProvider } from "../providers/MockProvider";
import { CoinGeckoProvider } from "../providers/CoinGeckoProvider";
import { BinanceProvider } from "../providers/BinanceProvider";
import { BcvProvider } from "../providers/BcvProvider";

const priceService = new PriceService([
  new MockProvider(),
  new CoinGeckoProvider(),
  new BinanceProvider(),
  new BcvProvider()
]);

export class PriceController {
  async getHistory(req: Request, res: Response) {
    try {
      const { symbol } = req.params as { symbol: string };
      const history = await priceService.getHistory(symbol);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async triggerFetch(req: Request, res: Response) {
    try {
      const { symbol } = req.params as { symbol: string };
      const provider = (req.query.provider as string) || 'Mock';
      const result = await priceService.fetchAndStorePrice(symbol, provider);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
