import { api } from './api';
import type { Product } from '@/types/models';

export const productsService = {
  getAll: (q?: string) =>
    api.get<Product[]>(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  create: (data: { nombre: string; precio: number }) =>
    api.post<Product>('/products', data),

  update: (id: number, data: { nombre?: string; precio?: number }) =>
    api.put<Product>(`/products/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/products/${id}`),
};
