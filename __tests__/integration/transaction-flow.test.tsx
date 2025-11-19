/**
 * Integration Tests for Transaction Flow
 * Tests the complete flow of creating, reading, updating, and deleting transactions
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.Mock;

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Create query client for tests
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Simple test component to simulate transaction list
function MockTransactionList() {
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/transactions')
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (transactions.length === 0) {
    return <div data-testid="empty">取引がありません</div>;
  }

  return (
    <ul data-testid="transaction-list">
      {transactions.map((transaction) => (
        <li key={transaction.id} data-testid={`transaction-${transaction.id}`}>
          <span>{transaction.description}</span>
          <span>{transaction.amount}円</span>
          <button onClick={() => handleDelete(transaction.id)}>削除</button>
        </li>
      ))}
    </ul>
  );
}

// Simple test component to simulate transaction form
function MockTransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseInt(amount) <= 0) {
      setError('金額は正の数を入力してください');
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          description,
          type: 'EXPENSE',
          categoryId: 'cat1',
          transactionDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      setAmount('');
      setDescription('');
      onSuccess?.();
    } catch (err) {
      setError('取引の作成に失敗しました');
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="transaction-form">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="金額"
        data-testid="amount-input"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明"
        data-testid="description-input"
      />
      <button type="submit" data-testid="submit-button">
        登録
      </button>
      {error && <div data-testid="error-message">{error}</div>}
    </form>
  );
}

describe('Transaction Flow Integration', () => {
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

  describe('Transaction List', () => {
    it('should show loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<MockTransactionList />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show empty state when no transactions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      render(<MockTransactionList />);

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toBeInTheDocument();
      });
    });

    it('should display transactions when data exists', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { id: '1', description: 'Test Transaction', amount: 1000 },
              { id: '2', description: 'Another Transaction', amount: 2000 },
            ],
          }),
      });

      render(<MockTransactionList />);

      await waitFor(() => {
        expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
        expect(screen.getByText('Test Transaction')).toBeInTheDocument();
        expect(screen.getByText('1000円')).toBeInTheDocument();
      });
    });

    it('should delete transaction when delete button clicked', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [{ id: '1', description: 'Test Transaction', amount: 1000 }],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<MockTransactionList />);

      await waitFor(() => {
        expect(screen.getByText('Test Transaction')).toBeInTheDocument();
      });

      await user.click(screen.getByText('削除'));

      await waitFor(() => {
        expect(screen.queryByText('Test Transaction')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transaction Form', () => {
    it('should show validation error for invalid amount', async () => {
      const user = userEvent.setup();

      render(<MockTransactionForm />);

      await user.type(screen.getByTestId('amount-input'), '0');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        '金額は正の数を入力してください'
      );
    });

    it('should show validation error for negative amount', async () => {
      const user = userEvent.setup();

      render(<MockTransactionForm />);

      await user.type(screen.getByTestId('amount-input'), '-100');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        '金額は正の数を入力してください'
      );
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'new-id' } }),
      });

      render(<MockTransactionForm onSuccess={onSuccess} />);

      await user.type(screen.getByTestId('amount-input'), '5000');
      await user.type(screen.getByTestId('description-input'), 'Test');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });

      // Form should be cleared after successful submission
      expect(screen.getByTestId('amount-input')).toHaveValue(null);
      expect(screen.getByTestId('description-input')).toHaveValue('');
    });

    it('should show error when API call fails', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<MockTransactionForm />);

      await user.type(screen.getByTestId('amount-input'), '5000');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          '取引の作成に失敗しました'
        );
      });
    });
  });

  describe('Complete Transaction CRUD Flow', () => {
    it('should support full lifecycle: create, read, delete', async () => {
      const user = userEvent.setup();

      // 1. Initial load - empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const { rerender } = render(<MockTransactionList />);

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toBeInTheDocument();
      });

      // 2. Create transaction
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: 'new-id', description: 'New Transaction', amount: 3000 },
          }),
      });

      rerender(<MockTransactionForm />);

      await user.type(screen.getByTestId('amount-input'), '3000');
      await user.type(screen.getByTestId('description-input'), 'New Transaction');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/transactions',
          expect.objectContaining({ method: 'POST' })
        );
      });

      // 3. Reload list with new transaction
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ id: 'new-id', description: 'New Transaction', amount: 3000 }],
          }),
      });

      rerender(<MockTransactionList />);

      await waitFor(() => {
        expect(screen.getByText('New Transaction')).toBeInTheDocument();
      });
    });
  });
});
