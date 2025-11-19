import axios, { AxiosInstance } from "axios";
import { getSession } from "next-auth/react";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
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

  async getTransaction(id: string) {
    return this.client.get(`/transactions/${id}`);
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

  async getVendors() {
    return this.client.get("/vendors");
  }

  async getVendor(id: string) {
    return this.client.get(`/vendors/${id}`);
  }

  async createVendor(data: any) {
    return this.client.post("/vendors", data);
  }

  async updateVendor(id: string, data: any) {
    return this.client.put(`/vendors/${id}`, data);
  }

  async deleteVendor(id: string) {
    return this.client.delete(`/vendors/${id}`);
  }

  // Categories
  async getCategories(params?: any) {
    return this.client.get("/categories", { params });
  }

  async getCategory(id: string) {
    return this.client.get(`/categories/${id}`);
  }

  async createCategory(data: any) {
    return this.client.post("/categories", data);
  }

  async updateCategory(id: string, data: any) {
    return this.client.put(`/categories/${id}`, data);
  }

  async deleteCategory(id: string) {
    return this.client.delete(`/categories/${id}`);
  }

  // Payment Methods
  async getPaymentMethods() {
    return this.client.get("/payment-methods");
  }

  // Reports
  async getSummaryReport(params: any) {
    return this.client.get("/reports/summary", { params });
  }

  // Users
  async getUsers() {
    return this.client.get("/users");
  }
}

export const api = new ApiClient();
