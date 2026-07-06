import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { ListingsService } from "../listings.service.js";
import { UserRole } from "../../../common/constants/roles.enums.js";
import { ProduceListingEntity } from "../../../database/entities/ProduceListingEntity.js";
import type { AccessTokenPayload } from "../../../common/types/express.js";
import { ListingsRepository } from "../listings.repository.js";

// ── 1. Mock dependencies ──────────────────────────────────────────────────────
const mockListingsRepository = {
  findById: jest.fn<(id: string) => Promise<ProduceListingEntity | null>>(),
  hasActiveOrders: jest.fn<(id: string) => Promise<boolean>>(),
  update: jest.fn<(id: string, data: Partial<ProduceListingEntity>) => Promise<void>>(),
  findPackagingById: jest.fn(),
  recommendPackaging: jest.fn(),
  findAll: jest.fn(),
};

// Mock the module that exports the repository
jest.mock("../listings.repository.js", () => {
  return {
    listingsRepository: mockListingsRepository,
    ListingsRepository: jest.fn().mockImplementation(() => mockListingsRepository),
  };
});

jest.mock("../../../infrastructure/cloudinary/cloudinary.client.js");
jest.mock("../../../common/utils/logger.js");
jest.mock("../../user/user.repository.js");

// ── 2. Initialize Service with Mock ──────────────────────────────────────────
const listingsService = new ListingsService(mockListingsRepository as unknown as ListingsRepository);

beforeEach(() => {
  jest.clearAllMocks();
});

// ── 3. Tests ──────────────────────────────────────────────────────────────────
describe("ListingsService", () => {
  describe("getById", () => {
    it("returns listing when it exists", async () => {
      const mockListing = { id: "list-123", vegetableType: "Tomatoes" } as Partial<ProduceListingEntity>;
      mockListingsRepository.findById.mockResolvedValue(mockListing as ProduceListingEntity);

      const result = await listingsService.getById("list-123");

      expect(result).toEqual(mockListing);
      expect(mockListingsRepository.findById).toHaveBeenCalledWith("list-123");
    });

    it("throws NotFoundException when listing does not exist", async () => {
      mockListingsRepository.findById.mockResolvedValue(null);

      await expect(listingsService.getById("nonexistent")).rejects.toThrow(
        "Listing not found",
      );
    });
  });

  describe("remove", () => {
    const caller: AccessTokenPayload = { sub: "farmer-1", role: UserRole.FARMER, type: "access" };

    it("cancels listing when valid and no active orders", async () => {
      const mockListing = { id: "list-123", farmerId: "farmer-1" } as ProduceListingEntity;
      mockListingsRepository.findById.mockResolvedValue(mockListing);
      mockListingsRepository.hasActiveOrders.mockResolvedValue(false);
      mockListingsRepository.update.mockResolvedValue(undefined);

      const result = await listingsService.remove(caller, "list-123");

      expect(result.message).toBe("Listing cancelled successfully");
      expect(mockListingsRepository.update).toHaveBeenCalledWith(
        "list-123",
        expect.objectContaining({ status: "cancelled" }),
      );
    });

    it("throws ConflictException when active orders exist", async () => {
      const mockListing = { id: "list-123", farmerId: "farmer-1" } as ProduceListingEntity;
      mockListingsRepository.findById.mockResolvedValue(mockListing);
      mockListingsRepository.hasActiveOrders.mockResolvedValue(true);

      await expect(listingsService.remove(caller, "list-123")).rejects.toThrow(
        "Cannot delete a listing that has an active order",
      );
    });
  });
});
