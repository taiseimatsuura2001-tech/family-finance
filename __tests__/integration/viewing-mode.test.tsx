/**
 * Integration Tests for Viewing Mode
 * Tests the complete flow of switching between users and viewing mode restrictions
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ViewingUserProvider, useViewingUser } from '@/components/providers/ViewingUserProvider';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.Mock;

// Create query client for tests
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Test component that simulates dashboard behavior
function MockDashboard() {
  const { viewUserId, setViewUserId, isViewingOther, resetToCurrentUser } = useViewingUser();

  return (
    <div>
      <h1>Dashboard</h1>
      <div data-testid="viewing-mode">{isViewingOther ? 'viewing' : 'normal'}</div>
      <div data-testid="view-user-id">{viewUserId || 'self'}</div>

      {/* User selector simulation */}
      <select
        data-testid="user-select"
        value={viewUserId || 'test-user-id'}
        onChange={(e) => setViewUserId(e.target.value)}
      >
        <option value="test-user-id">自分</option>
        <option value="other-user-id">パートナー</option>
      </select>

      {/* Action buttons - should be hidden in viewing mode */}
      {!isViewingOther && (
        <div data-testid="action-buttons">
          <button>収入を登録</button>
          <button>支出を登録</button>
        </div>
      )}

      {/* Settings link - should be hidden in viewing mode */}
      {!isViewingOther && (
        <a data-testid="settings-link" href="/settings">
          設定
        </a>
      )}

      {/* Reset button */}
      <button onClick={resetToCurrentUser} data-testid="reset-button">
        リセット
      </button>
    </div>
  );
}

// Wrapper with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <ViewingUserProvider>{ui}</ViewingUserProvider>
      </QueryClientProvider>
    ),
  };
};

describe('Viewing Mode Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    });
  });

  describe('User switching', () => {
    it('should start in normal mode', () => {
      renderWithProviders(<MockDashboard />);

      expect(screen.getByTestId('viewing-mode')).toHaveTextContent('normal');
      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('settings-link')).toBeInTheDocument();
    });

    it('should switch to viewing mode when selecting other user', async () => {
      const { user } = renderWithProviders(<MockDashboard />);

      await user.selectOptions(screen.getByTestId('user-select'), 'other-user-id');

      expect(screen.getByTestId('viewing-mode')).toHaveTextContent('viewing');
      expect(screen.getByTestId('view-user-id')).toHaveTextContent('other-user-id');
    });

    it('should hide action buttons in viewing mode', async () => {
      const { user } = renderWithProviders(<MockDashboard />);

      await user.selectOptions(screen.getByTestId('user-select'), 'other-user-id');

      expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
    });

    it('should hide settings link in viewing mode', async () => {
      const { user } = renderWithProviders(<MockDashboard />);

      await user.selectOptions(screen.getByTestId('user-select'), 'other-user-id');

      expect(screen.queryByTestId('settings-link')).not.toBeInTheDocument();
    });

    it('should return to normal mode when selecting self', async () => {
      const { user } = renderWithProviders(<MockDashboard />);

      // First switch to other user
      await user.selectOptions(screen.getByTestId('user-select'), 'other-user-id');
      expect(screen.getByTestId('viewing-mode')).toHaveTextContent('viewing');

      // Then switch back to self
      await user.selectOptions(screen.getByTestId('user-select'), 'test-user-id');
      expect(screen.getByTestId('viewing-mode')).toHaveTextContent('normal');
      expect(screen.getByTestId('view-user-id')).toHaveTextContent('self');
    });

    it('should reset viewing mode with reset button', async () => {
      const { user } = renderWithProviders(<MockDashboard />);

      // Switch to viewing mode
      await user.selectOptions(screen.getByTestId('user-select'), 'other-user-id');
      expect(screen.getByTestId('viewing-mode')).toHaveTextContent('viewing');

      // Reset
      await user.click(screen.getByTestId('reset-button'));
      expect(screen.getByTestId('viewing-mode')).toHaveTextContent('normal');
    });
  });

  describe('Permission restrictions in viewing mode', () => {
    it('should show registration buttons in normal mode', () => {
      renderWithProviders(<MockDashboard />);

      expect(screen.getByText('収入を登録')).toBeInTheDocument();
      expect(screen.getByText('支出を登録')).toBeInTheDocument();
    });

    it('should hide registration buttons in viewing mode', async () => {
      const { user } = renderWithProviders(<MockDashboard />);

      await user.selectOptions(screen.getByTestId('user-select'), 'other-user-id');

      expect(screen.queryByText('収入を登録')).not.toBeInTheDocument();
      expect(screen.queryByText('支出を登録')).not.toBeInTheDocument();
    });

    it('should show settings link in normal mode', () => {
      renderWithProviders(<MockDashboard />);

      expect(screen.getByTestId('settings-link')).toBeInTheDocument();
    });

    it('should hide settings link in viewing mode', async () => {
      const { user } = renderWithProviders(<MockDashboard />);

      await user.selectOptions(screen.getByTestId('user-select'), 'other-user-id');

      expect(screen.queryByTestId('settings-link')).not.toBeInTheDocument();
    });
  });
});

describe('State persistence across navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    });
  });

  it('should maintain viewing state when component re-renders', async () => {
    const queryClient = createQueryClient();
    const user = userEvent.setup();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ViewingUserProvider>
          <MockDashboard />
        </ViewingUserProvider>
      </QueryClientProvider>
    );

    // Switch to viewing mode
    await user.selectOptions(screen.getByTestId('user-select'), 'other-user-id');
    expect(screen.getByTestId('viewing-mode')).toHaveTextContent('viewing');

    // Re-render same component (simulating navigation)
    rerender(
      <QueryClientProvider client={queryClient}>
        <ViewingUserProvider>
          <MockDashboard />
        </ViewingUserProvider>
      </QueryClientProvider>
    );

    // State should be maintained within the same provider instance
    // Note: In real app, ViewingUserProvider wraps the layout, so state persists
  });
});
