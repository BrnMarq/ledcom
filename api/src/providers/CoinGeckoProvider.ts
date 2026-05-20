import axios from 'axios';
import { PriceProvider } from "@/providers/PriceProvider";

export class CoinGeckoProvider implements PriceProvider {
  getProviderName(): string {
    return 'CoinGecko';
  }

  async getPrice(symbol: string): Promise<number> {
    const symbolMap: Record<string, string> = {
      'BTC-USD': 'bitcoin',
      'ETH-USD': 'ethereum',
    };
    
    const coinId = symbolMap[symbol];
    if (!coinId) {
      throw new Error(`CoinGeckoProvider does not support symbol: ${symbol}`);
    }

    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    return response.data[coinId].usd;
  }
}
