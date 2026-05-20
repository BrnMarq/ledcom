import { PriceProvider } from "@/providers/PriceProvider";
import prisma from "@/client";

export class PriceService {
  private providers: Record<string, PriceProvider>;

  constructor(providers: PriceProvider[]) {
    this.providers = {};
    for (const provider of providers) {
      this.providers[provider.getProviderName()] = provider;
    }
  }

  async fetchAndStorePrice(symbol: string, providerName: string = 'Mock') {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const price = await provider.getPrice(symbol);
    const today = new Date();
    // Normalize to midnight for consistent daily records
    today.setHours(0, 0, 0, 0);

    return prisma.dailyPrice.upsert({
      where: {
        symbol_date_provider: {
          symbol,
          date: today,
          provider: provider.getProviderName()
        }
      },
      update: { price },
      create: {
        symbol,
        date: today,
        provider: provider.getProviderName(),
        price
      }
    });
  }

  async getHistory(symbol: string) {
    return prisma.dailyPrice.findMany({
      where: { symbol },
      orderBy: { date: 'asc' }
    });
  }
}
