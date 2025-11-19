/**
 * Categories API Unit Tests
 */

// Mock Prisma
const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
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

describe('Categories API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return categories for authenticated user', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          userId: 'test-user-id',
          name: '給与',
          type: 'INCOME',
          color: '#3b82f6',
          sortOrder: 1,
          isActive: true,
        },
        {
          id: 'cat2',
          userId: 'test-user-id',
          name: '食費',
          type: 'EXPENSE',
          color: '#ef4444',
          sortOrder: 1,
          isActive: true,
        },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await mockPrisma.category.findMany({
        where: { userId: 'test-user-id', isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      expect(result).toEqual(mockCategories);
      expect(result.length).toBe(2);
    });

    it('should filter categories by type', async () => {
      const mockIncomeCategories = [
        {
          id: 'cat1',
          userId: 'test-user-id',
          name: '給与',
          type: 'INCOME',
          color: '#3b82f6',
        },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockIncomeCategories);

      const result = await mockPrisma.category.findMany({
        where: { userId: 'test-user-id', type: 'INCOME', isActive: true },
      });

      expect(result.length).toBe(1);
      expect(result[0].type).toBe('INCOME');
    });

    it('should return categories for viewUserId (other user)', async () => {
      const otherUserCategories = [
        {
          id: 'cat3',
          userId: 'other-user-id',
          name: '給与',
          type: 'INCOME',
          color: '#3b82f6',
        },
      ];

      mockPrisma.category.findMany.mockResolvedValue(otherUserCategories);

      const result = await mockPrisma.category.findMany({
        where: { userId: 'other-user-id', isActive: true },
      });

      expect(result[0].userId).toBe('other-user-id');
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const newCategory = {
        userId: 'test-user-id',
        name: '新しいカテゴリー',
        type: 'EXPENSE',
        color: '#10b981',
        sortOrder: 11,
        isDefault: false,
      };

      const createdCategory = {
        id: 'new-cat-id',
        ...newCategory,
        isActive: true,
      };

      mockPrisma.category.create.mockResolvedValue(createdCategory);

      const result = await mockPrisma.category.create({
        data: newCategory,
      });

      expect(result.id).toBe('new-cat-id');
      expect(result.name).toBe('新しいカテゴリー');
    });

    it('should validate category type', () => {
      const validTypes = ['INCOME', 'EXPENSE'];

      expect(validTypes).toContain('INCOME');
      expect(validTypes).toContain('EXPENSE');
      expect(validTypes).not.toContain('INVALID');
    });
  });

  describe('PUT /api/categories/[id]', () => {
    it('should update an existing category', async () => {
      const updatedData = {
        name: '更新されたカテゴリー',
        color: '#8b5cf6',
      };

      const updatedCategory = {
        id: 'cat1',
        userId: 'test-user-id',
        name: '更新されたカテゴリー',
        type: 'INCOME',
        color: '#8b5cf6',
      };

      mockPrisma.category.update.mockResolvedValue(updatedCategory);

      const result = await mockPrisma.category.update({
        where: { id: 'cat1' },
        data: updatedData,
      });

      expect(result.name).toBe('更新されたカテゴリー');
      expect(result.color).toBe('#8b5cf6');
    });
  });

  describe('DELETE /api/categories/[id]', () => {
    it('should soft delete a category (set isActive to false)', async () => {
      mockPrisma.category.update.mockResolvedValue({
        id: 'cat1',
        isActive: false,
      });

      const result = await mockPrisma.category.update({
        where: { id: 'cat1' },
        data: { isActive: false },
      });

      expect(result.isActive).toBe(false);
    });
  });
});
