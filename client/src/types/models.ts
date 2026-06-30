export type TableStatus = 'free' | 'occupied' | 'pending_payment' | 'partial' | 'paid';

export type Zone = 'interior' | 'terraza';

export interface Table {
  id: number;
  zone: Zone;
  numero: number;
  nombre: string;
  status: TableStatus;
  waiter_id?: number | null;
  ultimo_servicio?: { cliente: string; total: number; comensales: number };
}

export interface OrderItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface Occupation {
  id: number;
  table_id: number;
  waiter_id: number | null;
  cliente: string;
  comensales: number;
  nota: string;
  items?: OrderItem[];
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_expiracion: string;
  total: number;
}

export type ProductCategory = 'bebida' | 'comida';

export interface Product {
  id: number;
  nombre: string;
  precio: number;
  categoria?: ProductCategory;
}

export interface Waiter {
  id: number;
  nombre: string;
  auth_uid?: string;
  activo: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  assigned_table_ids?: number[];
  email?: string;
  bloqueado?: boolean;
  eliminado?: boolean;
}

export interface Session {
  id: number;
  codigo: string;
  activa: boolean;
  fecha_creacion: string;
}

// ── Firebase Auth / Company ────────────────────────────────────────────────

export type UserRole = 'admin' | 'waiter';

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface CompanyUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  bloqueado?: boolean;
  eliminado?: boolean;
}

export interface Report {
  id: string;
  createdAt: string;
  closedAt: string;
  total: number;
  closedBy: string;
  waiterSummaries: WaiterSummary[];
  notes: string;
}

export interface WaiterSummary {
  waiterId: string;
  nombre: string;
  totalSales: number;
}
