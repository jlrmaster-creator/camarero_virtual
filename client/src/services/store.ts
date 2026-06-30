import type { Table, Occupation, Product, Waiter, Zone, ProductCategory } from '@/types/models';
import { createFirestoreStore, type FirestoreStore } from './firebaseStore';
import * as local from './localStore';
import { api } from './api';

export type Source = 'api' | 'local' | 'firebase';

let _source: Source = 'api';
let _firebaseStore: FirestoreStore | null = null;

export function setStoreSource(source: Source): void {
  _source = source;
}

export function getStoreSource(): Source {
  return _source;
}

export function setFirebaseCompanyId(companyId: string | null): void {
  if (companyId) {
    _firebaseStore = createFirestoreStore(companyId);
  } else {
    _firebaseStore = null;
  }
}

// Helper: augment table with occupation for local mode
function localWithOccupation(table: Table): Record<string, unknown> {
  const occ = local.localOccupations.getByTableId(table.id);
  return { ...table, occupation: occ ?? null };
}

// Helper: augment table with occupation for firebase mode
async function fbWithOccupation(table: Table): Promise<Record<string, unknown>> {
  if (!_firebaseStore) throw new Error('Firebase store not initialized');
  const occ = await _firebaseStore.occupations.getByTableId(table.id);
  return { ...table, occupation: occ ?? null };
}

// --- Tables ---

export const store = {
  async getTables(zone?: Zone): Promise<Record<string, unknown>[]> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized (missing company)');
      const tables = await _firebaseStore.tables.getAll(zone);
      return Promise.all(tables.map(fbWithOccupation));
    }
    if (_source === 'api') {
      return api.get<Record<string, unknown>[]>('/tables' + (zone ? `?zone=${zone}` : ''));
    }
    return local.localTables.getAll(zone).map(localWithOccupation);
  },

  async getTable(id: number): Promise<Record<string, unknown>> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      const table = await _firebaseStore.tables.getById(id);
      if (!table) throw new Error('Table not found');
      const occ = await _firebaseStore.occupations.getByTableId(id);
      return { ...table, occupation: occ ?? null };
    }
    if (_source === 'api') {
      return api.get<Record<string, unknown>>(`/tables/${id}`);
    }
    const table = local.localTables.getById(id);
    if (!table) throw new Error('Table not found');
    return localWithOccupation(table);
  },

  async updateTable(id: number, data: Partial<Table>): Promise<Table> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      const t = await _firebaseStore.tables.update(id, data as Partial<Table>);
      if (!t) throw new Error('Table not found');
      return t;
    }
    if (_source === 'api') {
      return api.put<Table>(`/tables/${id}`, data);
    }
    const t = local.localTables.update(id, data as Partial<Table>);
    if (!t) throw new Error('Table not found');
    return t;
  },

  // --- Occupations ---

  async createOccupation(data: { table_id: number; waiter_id?: number | null; cliente?: string; comensales?: number; nota?: string }): Promise<Occupation> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      const occ = await _firebaseStore.occupations.create(data);
      await _firebaseStore.tables.update(data.table_id, { status: 'occupied' });
      return occ;
    }
    if (_source === 'api') {
      return api.post<Occupation>('/occupations', data);
    }
    const occ = local.localOccupations.create(data);
    local.localTables.update(data.table_id, { status: 'occupied' });
    return occ;
  },

  async updateOccupation(id: number, data: Partial<Occupation>): Promise<Occupation> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      const occ = await _firebaseStore.occupations.update(id, data);
      if (!occ) throw new Error('Occupation not found');
      return occ;
    }
    if (_source === 'api') {
      return api.put<Occupation>(`/occupations/${id}`, data);
    }
    const occ = local.localOccupations.update(id, data);
    if (!occ) throw new Error('Occupation not found');
    return occ;
  },

  async finishOccupation(id: number, tableId: number): Promise<void> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      await _firebaseStore.occupations.finish(id);
      await _firebaseStore.tables.update(tableId, { status: 'free' });
      return;
    }
    if (_source === 'api') {
      await api.delete(`/occupations/${id}/finish`);
      return;
    }
    local.localOccupations.finish(id);
    local.localTables.update(tableId, { status: 'free' });
  },

  // --- Products ---

  async getProducts(q?: string): Promise<Product[]> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      return _firebaseStore.products.getAll(q);
    }
    if (_source === 'api') return api.get<Product[]>('/products' + (q ? `?q=${encodeURIComponent(q)}` : ''));
    return local.localProducts.getAll(q);
  },

  async createProduct(data: { nombre: string; precio: number; categoria?: ProductCategory }): Promise<Product> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      return _firebaseStore.products.create(data);
    }
    if (_source === 'api') return api.post<Product>('/products', data);
    return local.localProducts.create(data);
  },

  async updateProduct(id: number, data: { nombre?: string; precio?: number; categoria?: ProductCategory }): Promise<Product> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      const p = await _firebaseStore.products.update(id, data);
      if (!p) throw new Error('Product not found');
      return p;
    }
    if (_source === 'api') return api.put<Product>(`/products/${id}`, data);
    const p = local.localProducts.update(id, data);
    if (!p) throw new Error('Product not found');
    return p;
  },

  async deleteProduct(id: number): Promise<void> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      await _firebaseStore.products.delete(id);
      return;
    }
    if (_source === 'api') { await api.delete(`/products/${id}`); return; }
    local.localProducts.delete(id);
  },

  // --- Waiters ---

  async getWaiters(activo?: boolean): Promise<Waiter[]> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      return _firebaseStore.waiters.getAll(activo);
    }
    if (_source === 'api') return api.get<Waiter[]>('/waiters' + (activo !== undefined ? `?activo=${activo}` : ''));
    return local.localWaiters.getAll(activo);
  },

  async createWaiter(nombre: string, authUid?: string): Promise<Waiter> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      return _firebaseStore.waiters.create(nombre, authUid);
    }
    if (_source === 'api') return api.post<Waiter>('/waiters', { nombre });
    return local.localWaiters.create(nombre);
  },

  async updateWaiter(id: number, data: Partial<Pick<Waiter, 'nombre' | 'activo'>>): Promise<Waiter> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      const w = await _firebaseStore.waiters.update(id, data);
      if (!w) throw new Error('Waiter not found');
      return w;
    }
    throw new Error('updateWaiter only supported in Firebase mode');
  },

  async deleteWaiter(id: number): Promise<void> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      await _firebaseStore.waiters.remove(id);
      return;
    }
    throw new Error('deleteWaiter only supported in Firebase mode');
  },

  async startWaiterShift(id: number): Promise<Waiter> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      const w = await _firebaseStore.waiters.startShift(id);
      if (!w) throw new Error('Waiter not found');
      return w;
    }
    if (_source === 'api') return api.post<Waiter>(`/waiters/${id}/start`);
    const w = local.localWaiters.startShift(id);
    if (!w) throw new Error('Waiter not found');
    return w;
  },

  async endWaiterShift(id: number): Promise<Waiter> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      const w = await _firebaseStore.waiters.endShift(id);
      if (!w) throw new Error('Waiter not found');
      return w;
    }
    if (_source === 'api') return api.post<Waiter>(`/waiters/${id}/end`);
    const w = local.localWaiters.endShift(id);
    if (!w) throw new Error('Waiter not found');
    return w;
  },

  async assignTable(waiterId: number, tableId: number): Promise<void> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      await _firebaseStore.waiters.assignTable(waiterId, tableId);
      return;
    }
    throw new Error('assignTable only supported in Firebase mode');
  },

  async unassignTable(waiterId: number, tableId: number): Promise<void> {
    if (_source === 'firebase') {
      if (!_firebaseStore) throw new Error('Firebase store not initialized');
      await _firebaseStore.waiters.unassignTable(waiterId, tableId);
      return;
    }
    throw new Error('unassignTable only supported in Firebase mode');
  },
};
