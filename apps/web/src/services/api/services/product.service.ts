import type { Category, CreateProductData, Product, UpdateProductData } from "@/shared/validation";
import { apiClient } from "../index";

export const ProductService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  },

  async getProducts(filters?: {
    category_id?: string;
    district?: string;
    status?: string;
  }): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>("/products", { params: filters });
    return data;
  },

  async getMyProducts(status?: string): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>("/products/me", { params: { status } });
    return data;
  },

  async getProductById(id: string): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  async createProduct(payload: CreateProductData, status = "draft"): Promise<Product> {
    const { data } = await apiClient.post<Product>("/products", { ...payload, status });
    return data;
  },

  async updateProduct(id: string, updates: UpdateProductData): Promise<Product> {
    const { data } = await apiClient.patch<Product>(`/products/${id}`, updates);
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async archiveProduct(id: string): Promise<Product> {
    const { data } = await apiClient.post<Product>(`/products/${id}/archive`);
    return data;
  },

  async publishProduct(id: string): Promise<Product> {
    const { data } = await apiClient.post<Product>(`/products/${id}/publish`);
    return data;
  },

  async uploadImage(id: string, file: File): Promise<{ url: string; product: Product }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<{ url: string; product: Product }>(
      `/products/${id}/images`,
      formData,
    );
    return data;
  },
};
