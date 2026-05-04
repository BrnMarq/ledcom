import { ContextService } from './ContextService';
import { prismaMock } from '../singleton';

describe('ContextService', () => {
  let contextService: ContextService;

  beforeEach(() => {
    contextService = new ContextService();
    delete process.env.GEMINI_API_KEY; // Ensure mock mode is used
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process AUDIO media and update transaction in Spanish', async () => {
    // Arrange
    const mediaId = 1;
    const transactionId = 100;
    
    // Setup mock return for findUnique
    prismaMock.transactionMedia.findUnique.mockResolvedValue({
      id: mediaId,
      url: '/uploads/test.mp3',
      type: 'AUDIO',
      transactionId: transactionId,
      createdAt: new Date()
    });

    prismaMock.transaction.update.mockResolvedValue({} as any);

    // Act
    await contextService.processMedia(mediaId, transactionId);
    
    // Assert
    expect(prismaMock.transactionMedia.findUnique).toHaveBeenCalledWith({ where: { id: mediaId } });
    expect(prismaMock.transaction.update).toHaveBeenCalledWith({
      where: { id: transactionId },
      data: {
        context: "[AI Audio Transcript]: Compré 3 cebollas, un café y una galleta.",
        totalValue: 6,
        status: "COMPLETED",
        items: {
          create: [
            { name: "Cebolla", quantity: 3, unitPrice: 0.50, totalPrice: 1.50 },
            { name: "Café", quantity: 1, unitPrice: 3.00, totalPrice: 3.00 },
            { name: "Galleta", quantity: 1, unitPrice: 1.50, totalPrice: 1.50 }
          ]
        }
      }
    });
  });
});
