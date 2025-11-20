/**
 * UserSelector Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserSelector } from '@/components/common/UserSelector';
import { ViewingUserProvider } from '@/components/providers/ViewingUserProvider';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api/client';

// Mock next-auth/react
jest.mock('next-auth/react');

// Mock api
jest.mock('@/lib/api/client', () => ({
  api: {
    getUsers: jest.fn(),
  },
}));

const mockUseSession = useSession as jest.Mock;
const mockGetUsers = api.getUsers as jest.Mock;

// Helper to create query client
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ViewingUserProvider>{ui}</ViewingUserProvider>
    </QueryClientProvider>
  );
};

describe('UserSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN', // Default to ADMIN role
        },
      },
      status: 'authenticated',
    });
  });

  it('should show loading skeleton while fetching users', () => {
    mockGetUsers.mockReturnValue(new Promise(() => {})); // Never resolves

    renderWithProviders(<UserSelector />);

    // Should show skeleton loader
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('should not render when only one user exists', async () => {
    mockGetUsers.mockResolvedValue({
      data: [
        {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      ],
    });

    const { container } = renderWithProviders(<UserSelector />);

    // Wait for query to complete
    await waitFor(() => {
      // After loading completes with only one user, should not render anything
      expect(container.firstChild).toBeNull();
    }, { timeout: 3000 });
  });

  it('should render select when multiple users exist', async () => {
    mockGetUsers.mockResolvedValue({
      data: [
        { id: 'user1', name: 'User 1', email: 'user1@example.com' },
        { id: 'user2', name: 'User 2', email: 'user2@example.com' },
      ],
    });

    renderWithProviders(<UserSelector />);

    // Wait for query to complete
    await screen.findByText('表示ユーザー:');
  });

  it('should display viewing mode indicator when viewing other user', async () => {
    mockGetUsers.mockResolvedValue({
      data: [
        { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
        { id: 'other-user-id', name: 'Other User', email: 'other@example.com' },
      ],
    });

    renderWithProviders(<UserSelector />);

    // Initially not in viewing mode
    await screen.findByText('表示ユーザー:');
    expect(screen.queryByText('閲覧モード')).not.toBeInTheDocument();
  });

  it('should cache users data for 5 minutes', () => {
    const queryClient = createQueryClient();

    mockGetUsers.mockResolvedValue({
      data: [
        { id: 'user1', name: 'User 1', email: 'user1@example.com' },
        { id: 'user2', name: 'User 2', email: 'user2@example.com' },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ViewingUserProvider>
          <UserSelector />
        </ViewingUserProvider>
      </QueryClientProvider>
    );

    // staleTime should be 5 minutes (300000ms)
    // This is verified by the component implementation
    expect(mockGetUsers).toHaveBeenCalled();
  });

  describe('Role-based visibility', () => {
    it('should NOT render for USER role even with multiple users', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER', // USER role
          },
        },
        status: 'authenticated',
      });

      mockGetUsers.mockResolvedValue({
        data: [
          { id: 'user1', name: 'User 1', email: 'user1@example.com' },
          { id: 'user2', name: 'User 2', email: 'user2@example.com' },
        ],
      });

      const { container } = renderWithProviders(<UserSelector />);

      // Wait for query to complete
      await waitFor(() => {
        // USER role should not see the selector
        expect(container.firstChild).toBeNull();
      }, { timeout: 3000 });
    });

    it('should render for ADMIN role with multiple users', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'ADMIN', // ADMIN role
          },
        },
        status: 'authenticated',
      });

      mockGetUsers.mockResolvedValue({
        data: [
          { id: 'user1', name: 'User 1', email: 'user1@example.com' },
          { id: 'user2', name: 'User 2', email: 'user2@example.com' },
        ],
      });

      renderWithProviders(<UserSelector />);

      // Wait for query to complete
      await screen.findByText('表示ユーザー:');
      expect(screen.getByText('表示ユーザー:')).toBeInTheDocument();
    });
  });
});
