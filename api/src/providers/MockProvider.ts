import { PriceProvider } from "@/providers/PriceProvider";

export class MockProvider implements PriceProvider {
  getProviderName(): string {
    return 'Mock';
  }

  async getPrice(symbol: string): Promise<number> {
    // Deterministic mock for demo purposes
    if (symbol === 'BTC-USD') return 42000.50;
    if (symbol === 'ETH-USD') return 2500.00;
    if (symbol === 'EUR-USD') return 1.10;
    return 100.00; 
  }
}
