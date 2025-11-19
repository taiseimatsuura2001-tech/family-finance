/**
 * ViewingUserProvider Component Tests
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ViewingUserProvider, useViewingUser } from '@/components/providers/ViewingUserProvider';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.Mock;

// Test component to access context
function TestComponent() {
  const { viewUserId, setViewUserId, isViewingOther, resetToCurrentUser } = useViewingUser();

  return (
    <div>
      <span data-testid="viewUserId">{viewUserId || 'none'}</span>
      <span data-testid="isViewingOther">{isViewingOther ? 'true' : 'false'}</span>
      <button onClick={() => setViewUserId('other-user-id')}>Set Other User</button>
      <button onClick={() => setViewUserId('test-user-id')}>Set Current User</button>
      <button onClick={resetToCurrentUser}>Reset</button>
    </div>
  );
}

describe('ViewingUserProvider', () => {
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

  it('should provide initial state', () => {
    render(
      <ViewingUserProvider>
        <TestComponent />
      </ViewingUserProvider>
    );

    expect(screen.getByTestId('viewUserId')).toHaveTextContent('none');
    expect(screen.getByTestId('isViewingOther')).toHaveTextContent('false');
  });

  it('should set viewing other user', () => {
    render(
      <ViewingUserProvider>
        <TestComponent />
      </ViewingUserProvider>
    );

    act(() => {
      screen.getByText('Set Other User').click();
    });

    expect(screen.getByTestId('viewUserId')).toHaveTextContent('other-user-id');
    expect(screen.getByTestId('isViewingOther')).toHaveTextContent('true');
  });

  it('should reset when setting current user', () => {
    render(
      <ViewingUserProvider>
        <TestComponent />
      </ViewingUserProvider>
    );

    // First set other user
    act(() => {
      screen.getByText('Set Other User').click();
    });
    expect(screen.getByTestId('isViewingOther')).toHaveTextContent('true');

    // Then set current user - should reset
    act(() => {
      screen.getByText('Set Current User').click();
    });
    expect(screen.getByTestId('viewUserId')).toHaveTextContent('none');
    expect(screen.getByTestId('isViewingOther')).toHaveTextContent('false');
  });

  it('should reset to current user', () => {
    render(
      <ViewingUserProvider>
        <TestComponent />
      </ViewingUserProvider>
    );

    act(() => {
      screen.getByText('Set Other User').click();
    });
    expect(screen.getByTestId('isViewingOther')).toHaveTextContent('true');

    act(() => {
      screen.getByText('Reset').click();
    });
    expect(screen.getByTestId('viewUserId')).toHaveTextContent('none');
    expect(screen.getByTestId('isViewingOther')).toHaveTextContent('false');
  });

  it('should handle session not loaded', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(
      <ViewingUserProvider>
        <TestComponent />
      </ViewingUserProvider>
    );

    // When setting other user with no session, should still be in viewing mode
    act(() => {
      screen.getByText('Set Other User').click();
    });
    expect(screen.getByTestId('isViewingOther')).toHaveTextContent('true');
  });

  it('should throw error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useViewingUser must be used within a ViewingUserProvider');

    consoleError.mockRestore();
  });
});
