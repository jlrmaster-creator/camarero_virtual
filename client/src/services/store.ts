import type { Table, Occupation, Product, Waiter, Zone, ProductCategory } from '@/types/models';
import { createFirestoreStore, type FirestoreStore } from './firebaseStore';

let _firebaseStore: FirestoreStore | null = null;

export function setFirebaseCompanyId(companyId: string | null): void {
  if (companyId) {
    _firebaseStore = createFirestoreStore(companyId);
  } else {
    _firebaseStore = null;
  }
}

function getStore(): FirestoreStore {
  if (!_firebaseStore) throw new Error('Firebase store not initialized (missing company)');
  return _firebaseStore;
}

export const store = {
  async getTables(zone?: Zone): Promise<Record<string, unknown>[]> {
    const s = getStore();
    const tables = await s.tables.getAll(zone);
    return Promise.all(
      tables.map(async (table) => {
        const occ = await s.occupations.getByTableId(table.id);
        return { ...table, occupation: occ ?? null };
      }),
    );
  },

  async getTable(id: number): Promise<Record<string, unknown>> {
    const s = getStore();
    const table = await s.tables.getById(id);
    if (!table) throw new Error('Table not found');
    const occ = await s.occupations.getByTableId(id);
    return { ...table, occupation: occ ?? null };
  },

  async updateTable(id: number, data: Partial<Table>): Promise<Table> {
    const s = getStore();
    const t = await s.tables.update(id, data as Partial<Table>);
    if (!t) throw new Error('Table not found');
    return t;
  },

  async createOccupation(data: {
    table_id: number;
    waiter_id?: number | null;
    cliente?: string;
    comensales?: number;
    nota?: string;
  }): Promise<Occupation> {
    const s = getStore();
    const occ = await s.occupations.create(data);
    await s.tables.update(data.table_id, { status: 'occupied' });
    return occ;
  },

  async updateOccupation(id: number, data: Partial<Occupation>): Promise<Occupation> {
    const s = getStore();
    const occ = await s.occupations.update(id, data);
    if (!occ) throw new Error('Occupation not found');
    return occ;
  },

  async finishOccupation(id: number, tableId: number): Promise<void> {
    const s = getStore();
    await s.occupations.finish(id);
    await s.tables.update(tableId, { status: 'free' });
  },

  async getProducts(q?: string): Promise<Product[]> {
    return getStore().products.getAll(q);
  },

  async createProduct(data: { nombre: string; precio: number; categoria?: ProductCategory }): Promise<Product> {
    return getStore().products.create(data);
  },

  async updateProduct(id: number, data: { nombre?: string; precio?: number; categoria?: ProductCategory }): Promise<Product> {
    const p = await getStore().products.update(id, data);
    if (!p) throw new Error('Product not found');
    return p;
  },

  async deleteProduct(id: number): Promise<void> {
    await getStore().products.delete(id);
  },

  async getWaiters(activo?: boolean): Promise<Waiter[]> {
    return getStore().waiters.getAll(activo);
  },

  async createWaiter(nombre: string, authUid?: string): Promise<Waiter> {
    return getStore().waiters.create(nombre, authUid);
  },

  async updateWaiter(id: number, data: Partial<Pick<Waiter, 'nombre' | 'activo'>>): Promise<Waiter> {
    const w = await getStore().waiters.update(id, data);
    if (!w) throw new Error('Waiter not found');
    return w;
  },

  async deleteWaiter(id: number): Promise<void> {
    await getStore().waiters.remove(id);
  },

  async startWaiterShift(id: number): Promise<Waiter> {
    const w = await getStore().waiters.startShift(id);
    if (!w) throw new Error('Waiter not found');
    return w;
  },

  async endWaiterShift(id: number): Promise<Waiter> {
    const w = await getStore().waiters.endShift(id);
    if (!w) throw new Error('Waiter not found');
    return w;
  },

  async assignTable(waiterId: number, tableId: number): Promise<void> {
    await getStore().waiters.assignTable(waiterId, tableId);
  },

  async unassignTable(waiterId: number, tableId: number): Promise<void> {
    await getStore().waiters.unassignTable(waiterId, tableId);
  },
};
