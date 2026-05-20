import axios from "axios";
import { BcvProvider } from "@/providers/BcvProvider";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("BcvProvider", () => {
  let provider: BcvProvider;

  beforeEach(() => {
    provider = new BcvProvider();
    jest.clearAllMocks();
  });

  it("should have correct provider name", () => {
    expect(provider.getProviderName()).toBe("BCV");
  });

  it("should fetch the correct average price", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        promedio: 487.11,
      },
    });

    const price = await provider.getPrice("USDT-VES");
    expect(price).toBe(487.11);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://ve.dolarapi.com/v1/dolares/oficial"
    );
  });

  it("should throw error if symbol is not USDT-VES", async () => {
    await expect(provider.getPrice("BTC-USD")).rejects.toThrow(
      "BcvProvider does not support symbol: BTC-USD"
    );
  });

  it("should throw error if API response does not contain a valid price", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        promedio: null,
      },
    });

    await expect(provider.getPrice("USDT-VES")).rejects.toThrow(
      "BcvProvider: Failed to extract a valid price from the API response."
    );
  });
});
