import { MockProvider } from "./MockProvider";

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  it('should return the provider name', () => {
    expect(provider.getProviderName()).toBe('Mock');
  });

  it('should return known prices for specific symbols', async () => {
    expect(await provider.getPrice('BTC-USD')).toBe(42000.50);
    expect(await provider.getPrice('ETH-USD')).toBe(2500.00);
  });

  it('should return a default price for unknown symbols', async () => {
    expect(await provider.getPrice('UNKNOWN')).toBe(100.00);
  });
});
