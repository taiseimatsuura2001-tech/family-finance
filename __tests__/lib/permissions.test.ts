/**
 * Permission Utility Functions Tests
 */

import { canViewUserData, getAllowedUserIds, validateUserAccess } from '@/lib/utils/permissions';

describe('Permission Utilities', () => {
  describe('canViewUserData', () => {
    it('should allow ADMIN to view their own data', () => {
      const result = canViewUserData('ADMIN', 'user1', 'user1');
      expect(result).toBe(true);
    });

    it('should allow ADMIN to view other users data', () => {
      const result = canViewUserData('ADMIN', 'user1', 'user2');
      expect(result).toBe(true);
    });

    it('should allow USER to view their own data', () => {
      const result = canViewUserData('USER', 'user1', 'user1');
      expect(result).toBe(true);
    });

    it('should NOT allow USER to view other users data', () => {
      const result = canViewUserData('USER', 'user1', 'user2');
      expect(result).toBe(false);
    });

    it('should deny access for unknown role', () => {
      const result = canViewUserData('UNKNOWN_ROLE', 'user1', 'user2');
      expect(result).toBe(false);
    });
  });

  describe('getAllowedUserIds', () => {
    it('should return requested user ID for ADMIN when specified', () => {
      const result = getAllowedUserIds('ADMIN', 'user1', 'user2');
      expect(result).toEqual(['user2']);
    });

    it('should return empty array for ADMIN when no user specified (all access)', () => {
      const result = getAllowedUserIds('ADMIN', 'user1', null);
      expect(result).toEqual([]);
    });

    it('should return current user ID for USER regardless of request', () => {
      const result = getAllowedUserIds('USER', 'user1', 'user2');
      expect(result).toEqual(['user1']);
    });

    it('should return current user ID for USER when no user specified', () => {
      const result = getAllowedUserIds('USER', 'user1', null);
      expect(result).toEqual(['user1']);
    });
  });

  describe('validateUserAccess', () => {
    it('should return current user ID when ADMIN accesses own data', () => {
      const result = validateUserAccess('ADMIN', 'user1', null);
      expect(result).toBe('user1');
    });

    it('should return requested user ID when ADMIN accesses other user data', () => {
      const result = validateUserAccess('ADMIN', 'user1', 'user2');
      expect(result).toBe('user2');
    });

    it('should return current user ID when USER accesses own data', () => {
      const result = validateUserAccess('USER', 'user1', null);
      expect(result).toBe('user1');
    });

    it('should throw error when USER tries to access other user data', () => {
      expect(() => {
        validateUserAccess('USER', 'user1', 'user2');
      }).toThrow('Access denied');
    });

    it('should throw error for unknown role', () => {
      expect(() => {
        validateUserAccess('UNKNOWN_ROLE', 'user1', 'user2');
      }).toThrow('Access denied');
    });
  });
});
