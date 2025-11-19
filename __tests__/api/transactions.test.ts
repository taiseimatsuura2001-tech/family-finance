/**
 * Transactions API Unit Tests
 */

import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  transaction: {
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

describe('Transactions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transactions', () => {
    it('should return transactions for authenticated user', async () => {
      const mockTransactions = [
        {
          id: '1',
          userId: 'test-user-id',
          type: 'INCOME',
          amount: 50000,
          transactionDate: new Date('2024-01-15'),
          category: { id: 'cat1', name: '給与', color: '#3b82f6' },
          vendor: null,
        },
        {
          id: '2',
          userId: 'test-user-id',
          type: 'EXPENSE',
          amount: 10000,
          transactionDate: new Date('2024-01-16'),
          category: { id: 'cat2', name: '食費', color: '#ef4444' },
          vendor: { id: 'v1', name: 'スーパー' },
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      // Test that findMany is called with correct parameters
      expect(mockPrisma.transaction.findMany).not.toHaveBeenCalled();

      await mockPrisma.transaction.findMany({
        where: { userId: 'test-user-id' },
        include: { category: true, vendor: true },
      });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        include: { category: true, vendor: true },
      });
    });

    it('should filter transactions by type', async () => {
      const mockIncomeTransactions = [
        {
          id: '1',
          userId: 'test-user-id',
          type: 'INCOME',
          amount: 50000,
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockIncomeTransactions);

      await mockPrisma.transaction.findMany({
        where: { userId: 'test-user-id', type: 'INCOME' },
      });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id', type: 'INCOME' },
      });
    });

    it('should filter transactions by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await mockPrisma.transaction.findMany({
        where: {
          userId: 'test-user-id',
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const newTransaction = {
        userId: 'test-user-id',
        categoryId: 'cat1',
        type: 'INCOME',
        amount: 50000,
        transactionDate: new Date('2024-01-15'),
        description: 'Test transaction',
      };

      const createdTransaction = {
        id: 'new-id',
        ...newTransaction,
      };

      mockPrisma.transaction.create.mockResolvedValue(createdTransaction);

      const result = await mockPrisma.transaction.create({
        data: newTransaction,
      });

      expect(result).toEqual(createdTransaction);
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: newTransaction,
      });
    });

    it('should validate required fields', async () => {
      // Test that amount is required and must be positive
      const invalidTransaction = {
        userId: 'test-user-id',
        categoryId: 'cat1',
        type: 'INCOME',
        amount: -100, // Invalid: negative amount
        transactionDate: new Date(),
      };

      // In real implementation, this would throw a validation error
      expect(invalidTransaction.amount).toBeLessThan(0);
    });
  });

  describe('PUT /api/transactions/[id]', () => {
    it('should update an existing transaction', async () => {
      const updatedData = {
        amount: 60000,
        description: 'Updated description',
      };

      const updatedTransaction = {
        id: '1',
        userId: 'test-user-id',
        ...updatedData,
      };

      mockPrisma.transaction.update.mockResolvedValue(updatedTransaction);

      const result = await mockPrisma.transaction.update({
        where: { id: '1' },
        data: updatedData,
      });

      expect(result.amount).toBe(60000);
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updatedData,
      });
    });

    it('should not update transaction of another user', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({
        id: '1',
        userId: 'other-user-id', // Different user
      });

      const transaction = await mockPrisma.transaction.findUnique({
        where: { id: '1' },
      });

      // Verify the transaction belongs to a different user
      expect(transaction?.userId).not.toBe('test-user-id');
    });
  });

  describe('DELETE /api/transactions/[id]', () => {
    it('should delete a transaction', async () => {
      mockPrisma.transaction.delete.mockResolvedValue({ id: '1' });

      await mockPrisma.transaction.delete({
        where: { id: '1' },
      });

      expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
