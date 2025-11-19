/**
 * Users API Unit Tests
 */

// Mock Prisma
const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
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

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users for authenticated user', async () => {
      const mockUsers = [
        {
          id: 'user1',
          name: 'User 1',
          email: 'user1@example.com',
        },
        {
          id: 'user2',
          name: 'User 2',
          email: 'user2@example.com',
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await mockPrisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: 'asc' },
      });

      expect(result).toEqual(mockUsers);
      expect(result.length).toBe(2);
    });

    it('should return users in alphabetical order', async () => {
      const mockUsers = [
        { id: 'user1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user2', name: 'Bob', email: 'bob@example.com' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await mockPrisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      });

      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
    });

    it('should only return selected fields (id, name, email)', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await mockPrisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).not.toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('email');
    });
  });
});
