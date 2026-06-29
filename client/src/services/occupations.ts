import { api } from './api';
import type { Occupation } from '@/types/models';

export const occupationsService = {
  create: (data: { table_id: number; waiter_id?: number | null; cliente?: string; comensales?: number; nota?: string }) =>
    api.post<Occupation>('/occupations', data),

  update: (id: number, data: { waiter_id?: number | null; cliente?: string; comensales?: number; nota?: string; total?: number }) =>
    api.put<Occupation>(`/occupations/${id}`, data),

  finish: (id: number) =>
    api.delete<{ success: boolean }>(`/occupations/${id}/finish`),
};
