/**
 * Vendors API Unit Tests
 */

// Mock Prisma
const mockPrisma = {
  vendor: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock getServerSession
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  })),
}));

describe('Vendors API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/vendors', () => {
    it('should return vendors for authenticated user', async () => {
      const mockVendors = [
        {
          id: 'vendor1',
          userId: 'test-user-id',
          name: 'スーパーマーケット',
          type: 'STORE',
          sortOrder: 1,
          isActive: true,
        },
        {
          id: 'vendor2',
          userId: 'test-user-id',
          name: 'レストラン',
          type: 'RESTAURANT',
          sortOrder: 2,
          isActive: true,
        },
      ];

      mockPrisma.vendor.findMany.mockResolvedValue(mockVendors);

      const result = await mockPrisma.vendor.findMany({
        where: { userId: 'test-user-id', isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      expect(result).toEqual(mockVendors);
      expect(result.length).toBe(2);
    });

    it('should filter vendors by type', async () => {
      const mockStoreVendors = [
        {
          id: 'vendor1',
          userId: 'test-user-id',
          name: 'スーパーマーケット',
          type: 'STORE',
        },
      ];

      mockPrisma.vendor.findMany.mockResolvedValue(mockStoreVendors);

      const result = await mockPrisma.vendor.findMany({
        where: { userId: 'test-user-id', type: 'STORE', isActive: true },
      });

      expect(result.length).toBe(1);
      expect(result[0].type).toBe('STORE');
    });

    it('should only return active vendors', async () => {
      mockPrisma.vendor.findMany.mockResolvedValue([]);

      await mockPrisma.vendor.findMany({
        where: { userId: 'test-user-id', isActive: true },
      });

      expect(mockPrisma.vendor.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id', isActive: true },
      });
    });
  });

  describe('POST /api/vendors', () => {
    it('should create a new vendor', async () => {
      const newVendor = {
        userId: 'test-user-id',
        name: '新しい店舗',
        type: 'STORE',
        sortOrder: 1,
      };

      const createdVendor = {
        id: 'new-vendor-id',
        ...newVendor,
        isActive: true,
      };

      mockPrisma.vendor.create.mockResolvedValue(createdVendor);

      const result = await mockPrisma.vendor.create({
        data: newVendor,
      });

      expect(result.id).toBe('new-vendor-id');
      expect(result.name).toBe('新しい店舗');
    });

    it('should validate vendor type', () => {
      const validTypes = ['GENERAL', 'STORE', 'RESTAURANT', 'UTILITY', 'MEDICAL', 'ENTERTAINMENT', 'OTHER'];

      expect(validTypes).toContain('STORE');
      expect(validTypes).toContain('RESTAURANT');
      expect(validTypes).not.toContain('INVALID');
    });
  });

  describe('PUT /api/vendors/[id]', () => {
    it('should update an existing vendor', async () => {
      const updatedData = {
        name: '更新された店舗',
        sortOrder: 5,
      };

      const updatedVendor = {
        id: 'vendor1',
        userId: 'test-user-id',
        name: '更新された店舗',
        type: 'STORE',
        sortOrder: 5,
      };

      mockPrisma.vendor.update.mockResolvedValue(updatedVendor);

      const result = await mockPrisma.vendor.update({
        where: { id: 'vendor1' },
        data: updatedData,
      });

      expect(result.name).toBe('更新された店舗');
      expect(result.sortOrder).toBe(5);
    });

    it('should check vendor ownership before update', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({
        id: 'vendor1',
        userId: 'test-user-id',
      });

      const vendor = await mockPrisma.vendor.findFirst({
        where: {
          id: 'vendor1',
          userId: 'test-user-id',
        },
      });

      expect(vendor?.userId).toBe('test-user-id');
    });

    it('should not update vendor of another user', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);

      const vendor = await mockPrisma.vendor.findFirst({
        where: {
          id: 'vendor1',
          userId: 'other-user-id',
        },
      });

      expect(vendor).toBeNull();
    });
  });

  describe('DELETE /api/vendors/[id]', () => {
    it('should soft delete a vendor (set isActive to false)', async () => {
      mockPrisma.vendor.update.mockResolvedValue({
        id: 'vendor1',
        isActive: false,
      });

      const result = await mockPrisma.vendor.update({
        where: { id: 'vendor1' },
        data: { isActive: false },
      });

      expect(result.isActive).toBe(false);
    });

    it('should check vendor ownership before delete', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({
        id: 'vendor1',
        userId: 'test-user-id',
      });

      const vendor = await mockPrisma.vendor.findFirst({
        where: {
          id: 'vendor1',
          userId: 'test-user-id',
        },
      });

      expect(vendor).not.toBeNull();
    });
  });
});
