import { api } from './api';
import type { Waiter } from '@/types/models';

export const waitersService = {
  getAll: (activo?: boolean) =>
    api.get<Waiter[]>(`/waiters${activo !== undefined ? `?activo=${activo}` : ''}`),

  create: (nombre: string) =>
    api.post<Waiter>('/waiters', { nombre }),

  startShift: (id: number) =>
    api.post<Waiter>(`/waiters/${id}/start`),

  endShift: (id: number) =>
    api.post<Waiter>(`/waiters/${id}/end`),
};
