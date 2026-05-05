import { ContextService } from "./ContextService";
import { prismaMock } from "../singleton";

describe("ContextService", () => {
  let contextService: ContextService;

  beforeEach(() => {
    contextService = new ContextService();
    delete process.env.GEMINI_API_KEY; // Ensure mock mode is used
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(contextService).toBeDefined();
  });
});
