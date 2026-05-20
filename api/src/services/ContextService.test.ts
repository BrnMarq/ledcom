import { ContextService } from "@/services/ContextService";
import { prismaMock } from "@/singleton";
import * as fs from "fs";

jest.mock("fs");

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

  describe("createTransactionFromMedia", () => {
    it("should create a transaction from audio using mock data", async () => {
      const accountId = 1;
      const fileUrl = "test-audio.m4a";
      const fileType = "AUDIO";

      // Mock prisma response
      const mockTransaction = {
        id: 1,
        accountId,
        totalValue: 6.0,
        type: "NEEDS",
        flow: "OUT",
        context: "[AI Audio Transcript]: Compré 3 cebollas, un café y una galleta.",
        status: "COMPLETED",
        date: new Date(),
        items: [],
        media: [],
      };
      
      prismaMock.transaction.create.mockResolvedValue(mockTransaction as any);

      const result = await contextService.createTransactionFromMedia(accountId, fileUrl, fileType);

      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 1,
          totalValue: 6.0,
          type: "NEEDS",
          flow: "OUT",
          status: "COMPLETED",
          context: "[AI Audio Transcript]: Compré 3 cebollas, un café y una galleta.",
          media: {
            create: {
              url: fileUrl,
              type: fileType,
            }
          }
        }),
        include: {
          items: true,
          media: true,
        }
      });
      
      expect(result).toEqual(mockTransaction);
    });

    it("should create a transaction from image using mock data", async () => {
        const accountId = 1;
        const fileUrl = "test-image.jpg";
        const fileType = "IMAGE";
  
        // Mock prisma response
        const mockTransaction = {
          id: 2,
          accountId,
          totalValue: 500.0,
          type: "WANTS",
          flow: "OUT",
          context: "[AI Image Analysis]: Extracto de recibo: 'Compra confirmada. Monto: $500.00'",
          status: "COMPLETED",
          date: new Date(),
          items: [],
          media: [],
        };
        
        prismaMock.transaction.create.mockResolvedValue(mockTransaction as any);
  
        const result = await contextService.createTransactionFromMedia(accountId, fileUrl, fileType);
  
        expect(prismaMock.transaction.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: 1,
            totalValue: 500.0,
            type: "WANTS",
            flow: "OUT",
            status: "COMPLETED",
            context: "[AI Image Analysis]: Extracto de recibo: 'Compra confirmada. Monto: $500.00'",
            media: {
              create: {
                url: fileUrl,
                type: fileType,
              }
            }
          }),
          include: {
            items: true,
            media: true,
          }
        });
        
        expect(result).toEqual(mockTransaction);
      });
  });
});
