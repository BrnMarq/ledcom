import request from "supertest";
import app from "../app";
import { prismaMock } from "../singleton";
import jwt from "jsonwebtoken";

const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || "test-secret");

// We need to mock the ContextService as it uses setTimeout and is async
jest.mock("../services/ContextService", () => {
  return {
    ContextService: jest.fn().mockImplementation(() => {
      return {
        createTransactionFromMedia: jest.fn().mockResolvedValue({
          id: 2,
          accountId: 1,
          totalValue: 500,
          type: "NEEDS",
          flow: "OUT",
          context: "Mock Context",
          status: "COMPLETED",
          items: [],
          media: [],
        }),
      };
    }),
  };
});

describe("TransactionController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/transactions/ should create a transaction from media upload", async () => {
    prismaMock.account.findFirst.mockResolvedValue({
      id: 1,
      userId: 1,
      name: "Mock Account",
      symbol: "USD",
      createdAt: new Date(),
    });
    const response = await request(app)
      .post("/api/transactions/")
      .set("Authorization", `Bearer ${token}`)
      .field("accountId", "1")
      .attach("file", Buffer.from("fake audio data"), "test.mp3");

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Transaction created successfully from media.",
    );
    expect(response.body.transaction).toHaveProperty("id", 2);
    expect(response.body.transaction).toHaveProperty("status", "COMPLETED");
  });
});
