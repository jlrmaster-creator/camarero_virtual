export type TableStatus = 'free' | 'occupied' | 'pending_payment' | 'partial' | 'paid';
export type Zone = 'interior' | 'terraza';

export interface TableRow {
  id: number;
  zone: Zone;
  numero: number;
  nombre: string;
  status: TableStatus;
}

export interface OccupationRow {
  id: number;
  table_id: number;
  waiter_id: number | null;
  cliente: string;
  comensales: number;
  nota: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_expiracion: string;
  total: number;
}

export interface ProductRow {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string;
}

export interface WaiterRow {
  id: number;
  nombre: string;
  activo: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}
