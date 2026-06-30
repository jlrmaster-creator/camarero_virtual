import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type Firestore,
  type DocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from '@/firebase/init';
import type { Table, Occupation, Product, Waiter, Zone, TableStatus } from '@/types/models';

// ── Scoped collection helpers ──────────────────────────────────────────────

function col(db: Firestore, companyId: string, name: string) {
  return collection(db, 'companies', companyId, name);
}

function docRef(db: Firestore, companyId: string, name: string, id: string) {
  return doc(db, 'companies', companyId, name, id);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function docData<T>(snap: { exists: () => boolean; data: () => unknown; id: string }): T | undefined {
  if (!snap.exists()) return undefined;
  const d = snap.data() as Record<string, unknown> | undefined;
  if (!d) return undefined;
  return { id: snap.id, ...d } as unknown as T;
}

function docsData<T>(snap: { docs: Array<{ exists: () => boolean; data: () => unknown; id: string }> }): T[] {
  return snap.docs.filter(d => d.exists()).map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as unknown as T);
}

// ── Default seed data ──────────────────────────────────────────────────────

const DEFAULT_TABLES = [
  ...Array.from({ length: 30 }, (_, i) => ({
    zone: 'interior' as Zone, numero: i + 1,
    nombre: `Mesa I${100 + i + 1}`, status: 'free' as TableStatus,
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    zone: 'terraza' as Zone, numero: i + 1,
    nombre: `Mesa EXT${200 + i + 1}`, status: 'free' as TableStatus,
  })),
];

const DEFAULT_PRODUCTS = [
  { nombre: 'Caña / Tubo', precio: 2.80 },
  { nombre: 'Cerveza Doble', precio: 3.80 },
  { nombre: 'Cerveza Jarra', precio: 4.50 },
  { nombre: 'Cerveza Sin Alcohol Caña', precio: 2.50 },
  { nombre: 'Mahou Cinco Estrellas', precio: 3.00 },
  { nombre: 'Estrella Galicia', precio: 3.00 },
  { nombre: 'Coca-Cola', precio: 2.50 },
  { nombre: 'Coca-Cola Zero', precio: 2.50 },
  { nombre: 'Fanta Naranja', precio: 2.50 },
  { nombre: 'Fanta Limón', precio: 2.50 },
  { nombre: 'Agua Mineral 500ml', precio: 1.50 },
  { nombre: 'Agua con Gas 500ml', precio: 1.80 },
  { nombre: 'Café Solo', precio: 1.50 },
  { nombre: 'Café con Leche', precio: 1.80 },
  { nombre: 'Tortilla de Patatas', precio: 8.00 },
  { nombre: 'Sandwich Mixto', precio: 5.00 },
  { nombre: 'Ginebra + Tónica', precio: 8.00 },
  { nombre: 'Ron + Cola', precio: 7.00 },
  { nombre: 'Vino Tinto Copa', precio: 3.00 },
  { nombre: 'Cava Brut Copa', precio: 3.50 },
];

// ── Firestore store factory ────────────────────────────────────────────────

export function createFirestoreStore(companyId: string) {
  const TABLES_COL = 'tables';
  const PRODUCTS_COL = 'products';
  const OCCUPATIONS_COL = 'occupations';
  const WAITERS_COL = 'waiters';

  return {
    // ── Tables ──────────────────────────────────────────────────────────

    tables: {
      async getAll(zone?: Zone): Promise<Table[]> {
        const database = getDb();
        const ref = col(database, companyId, TABLES_COL);
        const constraints = [];
        if (zone) constraints.push(where('zone', '==', zone));
        constraints.push(orderBy('numero'));
        const snap = await getDocs(query(ref, ...constraints));
        let tables = docsData<Table>(snap);
        if (tables.length === 0) {
          for (let i = 0; i < DEFAULT_TABLES.length; i++) {
            await setDoc(docRef(database, companyId, TABLES_COL, String(i + 1)), DEFAULT_TABLES[i]);
          }
          // Re-read after seeding
          const snap2 = await getDocs(query(ref, ...constraints));
          tables = docsData<Table>(snap2);
        }
        return tables;
      },

      async getById(id: number): Promise<Table | undefined> {
        const database = getDb();
        const snap = await getDoc(docRef(database, companyId, TABLES_COL, String(id)));
        return docData<Table>(snap);
      },

      async update(id: number, data: Partial<Table>): Promise<Table | undefined> {
        const database = getDb();
        const ref = docRef(database, companyId, TABLES_COL, String(id));
        await setDoc(ref, data, { merge: true });
        return this.getById(id);
      },
    },

    // ── Products ────────────────────────────────────────────────────────

    products: {
      async getAll(q?: string): Promise<Product[]> {
        const database = getDb();
        const ref = col(database, companyId, PRODUCTS_COL);
        const snap = await getDocs(query(ref, orderBy('nombre')));
        let products = docsData<Product>(snap);
        if (products.length === 0) {
          for (let i = 0; i < DEFAULT_PRODUCTS.length; i++) {
            await setDoc(docRef(database, companyId, PRODUCTS_COL, String(i + 1)), DEFAULT_PRODUCTS[i]);
          }
          const snap2 = await getDocs(query(ref, orderBy('nombre')));
          products = docsData<Product>(snap2);
        }
        if (q) return products.filter(p => p.nombre.toLowerCase().includes(q.toLowerCase()));
        return products;
      },

      async create(data: { nombre: string; precio: number }): Promise<Product> {
        const database = getDb();
        const ref = doc(col(database, companyId, PRODUCTS_COL));
        await setDoc(ref, data);
        return { id: parseInt(ref.id, 36), ...data };
      },

      async update(id: number, data: { nombre?: string; precio?: number }): Promise<Product | undefined> {
        const database = getDb();
        const ref = docRef(database, companyId, PRODUCTS_COL, String(id));
        await setDoc(ref, data, { merge: true });
        const snap = await getDoc(ref);
        return docData<Product>(snap);
      },

      async delete(id: number): Promise<void> {
        const database = getDb();
        await deleteDoc(docRef(database, companyId, PRODUCTS_COL, String(id)));
      },
    },

    // ── Occupations ─────────────────────────────────────────────────────

    occupations: {
      async getByTableId(tableId: number): Promise<Occupation | undefined> {
        const database = getDb();
        const ref = col(database, companyId, OCCUPATIONS_COL);
        const q = query(ref, where('table_id', '==', tableId), where('active', '==', true), limit(1));
        const snap = await getDocs(q);
        const occupations = docsData<Occupation>(snap);
        return occupations[0];
      },

      async create(data: { table_id: number; waiter_id?: number | null; cliente?: string; comensales?: number; nota?: string }): Promise<Occupation> {
        const database = getDb();
        const ref = doc(col(database, companyId, OCCUPATIONS_COL));
        const docData = {
          ...data,
          waiter_id: data.waiter_id ?? null,
          cliente: data.cliente ?? '',
          comensales: data.comensales ?? 1,
          nota: data.nota ?? '',
          total: 0,
          active: true,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
        };
        await setDoc(ref, docData);
        return { id: parseInt(ref.id, 36), ...docData } as unknown as Occupation;
      },

      async update(id: number, data: Partial<Occupation>): Promise<Occupation | undefined> {
        const database = getDb();
        const ref = docRef(database, companyId, OCCUPATIONS_COL, String(id));
        await setDoc(ref, { ...data, fecha_actualizacion: new Date().toISOString() }, { merge: true });
        const snap = await getDoc(ref);
        return docData<Occupation>(snap);
      },

      async finish(id: number): Promise<void> {
        const database = getDb();
        const ref = docRef(database, companyId, OCCUPATIONS_COL, String(id));
        await setDoc(ref, { active: false, fecha_actualizacion: new Date().toISOString() }, { merge: true });
      },
    },

    // ── Waiters ─────────────────────────────────────────────────────────

    waiters: {
      async getAll(activo?: boolean): Promise<Waiter[]> {
        const database = getDb();
        const ref = col(database, companyId, WAITERS_COL);
        const constraints = [];
        if (activo !== undefined) constraints.push(where('activo', '==', activo));
        constraints.push(orderBy('nombre'));
        const snap = await getDocs(query(ref, ...constraints));
        return docsData<Waiter>(snap);
      },

      async create(nombre: string, authUid?: string): Promise<Waiter> {
        const database = getDb();
        const ref = authUid
          ? doc(database, 'companies', companyId, WAITERS_COL, authUid)
          : doc(col(database, companyId, WAITERS_COL));
        const data = { nombre, auth_uid: authUid ?? null, activo: false, fecha_inicio: null, fecha_fin: null };
        await setDoc(ref, data);
        return { id: parseInt(ref.id, 36), ...data } as unknown as Waiter;
      },

      async update(id: number, data: Partial<Pick<Waiter, 'nombre' | 'activo'>>): Promise<Waiter | undefined> {
        const database = getDb();
        const ref = docRef(database, companyId, WAITERS_COL, String(id));
        await setDoc(ref, data, { merge: true });
        const snap = await getDoc(ref);
        return docData<Waiter>(snap);
      },

      async remove(id: number): Promise<void> {
        const database = getDb();
        await deleteDoc(docRef(database, companyId, WAITERS_COL, String(id)));
      },

      async startShift(id: number): Promise<Waiter | undefined> {
        const database = getDb();
        const ref = docRef(database, companyId, WAITERS_COL, String(id));
        await setDoc(ref, { activo: true, fecha_inicio: new Date().toISOString() }, { merge: true });
        const snap = await getDoc(ref);
        return docData<Waiter>(snap);
      },

      async endShift(id: number): Promise<Waiter | undefined> {
        const database = getDb();
        const ref = docRef(database, companyId, WAITERS_COL, String(id));
        await setDoc(ref, { activo: false, fecha_fin: new Date().toISOString() }, { merge: true });
        const snap = await getDoc(ref);
        return docData<Waiter>(snap);
      },

      async assignTable(waiterId: number, tableId: number): Promise<void> {
        const database = getDb();
        const ref = docRef(database, companyId, WAITERS_COL, String(waiterId));
        await setDoc(ref, { assigned_table_ids: arrayUnion(tableId) }, { merge: true });
      },

      async unassignTable(waiterId: number, tableId: number): Promise<void> {
        const database = getDb();
        const ref = docRef(database, companyId, WAITERS_COL, String(waiterId));
        await setDoc(ref, { assigned_table_ids: arrayRemove(tableId) }, { merge: true });
      },
    },
  };
}

export type FirestoreStore = ReturnType<typeof createFirestoreStore>;
