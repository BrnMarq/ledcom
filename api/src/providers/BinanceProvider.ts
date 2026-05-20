import axios from "axios";
import { PriceProvider } from "./PriceProvider";

export class BinanceProvider implements PriceProvider {
  getProviderName(): string {
    return "Binance";
  }

  async getPrice(symbol: string): Promise<number> {
    // Expected symbol format: ASSET-FIAT, e.g. USDT-VES, BTC-VES
    const parts = symbol.split("-");
    if (parts.length !== 2) {
      throw new Error(
        `BinanceProvider: Invalid symbol format ${symbol}. Expected ASSET-FIAT.`,
      );
    }

    const asset = parts[0];
    const fiat = parts[1];

    // As requested, restricting to Venezuelan P2P by defaulting to PagoMovil
    if (fiat !== "VES") {
      throw new Error(
        `BinanceProvider currently configured only for Venezuelan P2P (VES). Requested: ${fiat}`,
      );
    }

    const tradeType = "BUY";

    const url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";
    const headers = {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      C2CType: "c2c_web",
      ClientType: "web",
      "Content-Type": "application/json",
      Origin: "https://p2p.binance.com",
      Referer: `https://p2p.binance.com/en/trade/${tradeType.toLowerCase()}/${asset}?fiat=${fiat}&payment=ALL`,
    };

    const data = {
      fiat: fiat,
      asset: asset,
      tradeType: tradeType,
      page: 1,
      rows: 10,
      countries: [],
      proMerchantAds: false,
      shieldMerchantAds: false,
      filterType: "tradable",
      periods: [15],
      additionalKycVerifyFilter: 1,
      publisherType: "merchant",
      payTypes: ["PagoMovil"],
      classifies: ["mass", "profession", "fiat_trade"],
      tradedWith: false,
      followed: false,
    };

    try {
      const response = await axios.post(url, data, { headers });

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 1
      ) {
        const priceString = response.data.data[1].adv.price;
        const price = parseFloat(priceString);
        if (isNaN(price)) {
          throw new Error(
            `BinanceProvider: Failed to parse price "${priceString}"`,
          );
        }
        return price;
      } else {
        throw new Error(
          `BinanceProvider: No P2P ads found for ${symbol} using PagoMovil.`,
        );
      }
    } catch (error: any) {
      throw new Error(
        `BinanceProvider: Error fetching P2P price for ${symbol} - ${error.message}`,
      );
    }
  }
}
