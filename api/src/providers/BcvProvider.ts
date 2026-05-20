import axios from "axios";
import { PriceProvider } from "./PriceProvider";

export class BcvProvider implements PriceProvider {
  getProviderName(): string {
    return "BCV";
  }

  async getPrice(symbol: string): Promise<number> {
    if (symbol !== "USDT-VES") {
      throw new Error(`BcvProvider does not support symbol: ${symbol}`);
    }

    // We fetch the JSON from the dolarapi.com API to avoid SSL issues with the official BCV site
    const response = await axios.get("https://ve.dolarapi.com/v1/dolares/oficial");

    const price = response.data?.promedio;

    if (typeof price !== "number" || isNaN(price)) {
      throw new Error(
        `BcvProvider: Failed to extract a valid price from the API response.`,
      );
    }

    return price;
  }
}
