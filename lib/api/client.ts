import axios, { AxiosInstance } from "axios";
import { getSession } from "next-auth/react";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const session = await getSession();
        if (session?.user) {
          // Note: NextAuth.js handles auth through cookies, not Bearer tokens
          // This is here for potential future use with JWT strategy
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Transactions
  async getTransactions(params?: any) {
    return this.client.get("/transactions", { params });
  }

  async createTransaction(data: any) {
    return this.client.post("/transactions", data);
  }

  async updateTransaction(id: string, data: any) {
    return this.client.put(`/transactions/${id}`, data);
  }

  async deleteTransaction(id: string) {
    return this.client.delete(`/transactions/${id}`);
  }

  // Categories
  async getCategories(params?: any) {
    return this.client.get("/categories", { params });
  }

  async getSubcategories(categoryId: string) {
    return this.client.get(`/categories/${categoryId}/subcategories`);
  }

  async createCategory(data: any) {
    return this.client.post("/categories", data);
  }

  // Payment Methods
  async getPaymentMethods() {
    return this.client.get("/payment-methods");
  }

  // Reports
  async getSummaryReport(params: any) {
    return this.client.get("/reports/summary", { params });
  }
}

export const api = new ApiClient();
