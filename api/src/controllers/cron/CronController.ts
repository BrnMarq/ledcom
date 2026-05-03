import { Request, Response } from "express";
import * as crypto from 'crypto';
import { PriceService } from "../../services/PriceService";
import { MockProvider } from "../../providers/MockProvider";
import { CoinGeckoProvider } from "../../providers/CoinGeckoProvider";
import { BinanceProvider } from "../../providers/BinanceProvider";
import { BcvProvider } from "../../providers/BcvProvider";

const priceService = new PriceService([
  new MockProvider(),
  new CoinGeckoProvider(),
  new BinanceProvider(),
  new BcvProvider(),
]);

const TRACKED_ASSETS = [{ symbol: "USDT-VES", providers: ["BCV", "Binance"] }];

export class CronController {
  async triggerDailyPrices(req: Request, res: Response) {
    // Vercel Cron sends a specific authorization header. We check it here to ensure
    // random users can't trigger the daily job multiple times.
    const authHeader = req.headers.authorization || '';
    const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;

    let isAuthorized = false;
    if (authHeader.length === expectedHeader.length && expectedHeader.length > 0) {
      isAuthorized = crypto.timingSafeEqual(
        Buffer.from(authHeader),
        Buffer.from(expectedHeader)
      );
    }

    if (!isAuthorized) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log("[Cron] Starting Daily Price Job triggered by Vercel...");
    const results: any[] = [];

    for (const asset of TRACKED_ASSETS) {
      for (const provider of asset.providers) {
        try {
          const result = await priceService.fetchAndStorePrice(
            asset.symbol,
            provider,
          );
          console.log(
            `[Cron] Stored price for ${asset.symbol} from ${provider}`,
          );
          results.push({
            symbol: asset.symbol,
            provider,
            status: "success",
            data: result,
          });
        } catch (error: any) {
          console.error(
            `[Cron] Failed to store price for ${asset.symbol} from ${provider}`,
            error,
          );
          results.push({
            symbol: asset.symbol,
            provider,
            status: "error",
            message: error.message,
          });
        }
      }
    }

    res.status(200).json({
      message: "Daily price job completed",
      results,
    });
  }
}
