import { api } from './api';
import type { Table, Zone } from '@/types/models';

export interface TableWithOccupation extends Table {
  occupation: {
    id: number;
    waiter_id: number | null;
    cliente: string;
    comensales: number;
    nota: string;
    total: number;
    fecha_creacion: string;
  } | null;
}

export const tablesService = {
  getAll: (zone?: Zone) =>
    api.get<TableWithOccupation[]>(`/tables${zone ? `?zone=${zone}` : ''}`),

  getById: (id: number) =>
    api.get<TableWithOccupation>(`/tables/${id}`),

  update: (id: number, data: { nombre?: string; status?: string }) =>
    api.put<Table>(`/tables/${id}`, data),
};
