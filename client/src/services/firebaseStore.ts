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
  arrayUnion,
  arrayRemove,
  type Firestore,
} from 'firebase/firestore';
import { getDb } from '@/firebase/init';
import type { Table, Occupation, Product, Waiter, Zone, TableStatus, ProductCategory, GrupoPedido } from '@/types/models';

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

const DEFAULT_PRODUCTS: Array<{ nombre: string; precio: number; categoria: ProductCategory }> = [
  { nombre: 'Caña / Tubo', precio: 2.80, categoria: 'bebida' },
  { nombre: 'Cerveza Doble', precio: 3.80, categoria: 'bebida' },
  { nombre: 'Cerveza Jarra', precio: 4.50, categoria: 'bebida' },
  { nombre: 'Cerveza Sin Alcohol Caña', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Mahou Cinco Estrellas', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Estrella Galicia', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Clara (Cerveza con Limón)', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Coca-Cola', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Coca-Cola Zero', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Fanta Naranja', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Fanta Limón', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Agua Mineral 500ml', precio: 1.50, categoria: 'bebida' },
  { nombre: 'Agua con Gas 500ml', precio: 1.80, categoria: 'bebida' },
  { nombre: 'Tinto de Verano', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Café Solo', precio: 1.50, categoria: 'bebida' },
  { nombre: 'Café con Leche', precio: 1.80, categoria: 'bebida' },
  { nombre: 'Vino Tinto Copa', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Vino Blanco Copa', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Vino Rosado Copa', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Cava Brut Copa', precio: 3.50, categoria: 'bebida' },
  { nombre: 'Ginebra + Tónica', precio: 8.00, categoria: 'bebida' },
  { nombre: 'Ron + Cola', precio: 7.00, categoria: 'bebida' },
  { nombre: 'Vodka + Naranja', precio: 7.00, categoria: 'bebida' },
  { nombre: 'Whisky + Cola', precio: 7.00, categoria: 'bebida' },
  { nombre: 'Cuba Libre', precio: 7.00, categoria: 'bebida' },
  { nombre: 'Mojito', precio: 8.00, categoria: 'bebida' },
  { nombre: 'Gin Tonic Premium', precio: 9.00, categoria: 'bebida' },
  { nombre: 'Chupito de Whisky', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Chupito de Vodka', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Chupito de Ron', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Chupito de Tequila', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Licor de Hierbas', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Pacharán', precio: 3.00, categoria: 'bebida' },
  { nombre: 'Orujo', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Anís', precio: 2.50, categoria: 'bebida' },
  { nombre: 'Tortilla de Patatas', precio: 8.00, categoria: 'comida' },
  { nombre: 'Sandwich Mixto', precio: 5.00, categoria: 'comida' },
  { nombre: 'Patatas Bravas', precio: 6.00, categoria: 'comida' },
  { nombre: 'Calamares a la Romana', precio: 9.00, categoria: 'comida' },
  { nombre: 'Croquetas Variadas (8ud)', precio: 7.00, categoria: 'comida' },
  { nombre: 'Ensaladilla Rusa', precio: 6.00, categoria: 'comida' },
  { nombre: 'Jamón Serrano (ración)', precio: 12.00, categoria: 'comida' },
  { nombre: 'Queso Manchego (ración)', precio: 10.00, categoria: 'comida' },
  { nombre: 'Chorizo al Vino (ración)', precio: 8.00, categoria: 'comida' },
  { nombre: 'Pimientos de Padrón', precio: 6.00, categoria: 'comida' },
  { nombre: 'Gambas al Ajillo', precio: 10.00, categoria: 'comida' },
  { nombre: 'Pulpo a la Gallega', precio: 12.00, categoria: 'comida' },
  { nombre: 'Tabla de Quesos', precio: 14.00, categoria: 'comida' },
  { nombre: 'Tabla de Embutidos', precio: 12.00, categoria: 'comida' },
  { nombre: 'Bocadillo de Jamón Serrano', precio: 5.00, categoria: 'comida' },
  { nombre: 'Bocadillo de Lomo', precio: 5.50, categoria: 'comida' },
  { nombre: 'Bocadillo de Tortilla', precio: 4.50, categoria: 'comida' },
  { nombre: 'Bocadillo de Calamares', precio: 6.00, categoria: 'comida' },
  { nombre: 'Bocadillo Vegetal', precio: 5.00, categoria: 'comida' },
  { nombre: 'Hamburguesa de Ternera', precio: 8.00, categoria: 'comida' },
  { nombre: 'Perrito Caliente', precio: 5.00, categoria: 'comida' },
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

      async create(data: { nombre: string; precio: number; categoria?: ProductCategory }): Promise<Product> {
        const database = getDb();
        const ref = doc(col(database, companyId, PRODUCTS_COL));
        await setDoc(ref, data);
        return { id: parseInt(ref.id, 36), ...data };
      },

      async update(id: number, data: { nombre?: string; precio?: number; categoria?: ProductCategory }): Promise<Product | undefined> {
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

      async create(data: { table_id: number; waiter_id?: number | null; cliente?: string; comensales?: number; nota?: string; grupos?: GrupoPedido[] }): Promise<Occupation> {
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
          grupos: data.grupos ?? [
            {
              id: 'g1',
              nombre: data.cliente?.trim() || 'Comensal',
              comensales: data.comensales ?? 1,
              items: [],
            },
          ],
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
        await setDoc(ref, {
          active: false,
          fecha_actualizacion: new Date().toISOString(),
        }, { merge: true });
      },

      async getAllActive(): Promise<Occupation[]> {
        const database = getDb();
        const ref = col(database, companyId, OCCUPATIONS_COL);
        const q = query(ref, where('active', '==', true));
        const snap = await getDocs(q);
        return docsData<Occupation>(snap);
      },

      async getAllFinished(): Promise<Occupation[]> {
        const database = getDb();
        const ref = col(database, companyId, OCCUPATIONS_COL);
        const q = query(ref, where('active', '==', false));
        const snap = await getDocs(q);
        return docsData<Occupation>(snap);
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

    // ── Reset ───────────────────────────────────────────────────────────

    async resetAllTables(): Promise<void> {
      const database = getDb();

      // 1. Deactivate all active occupations
      const activeOccupations = await this.occupations.getAllActive();
      await Promise.all(
        activeOccupations.map(occ =>
          setDoc(
            docRef(database, companyId, OCCUPATIONS_COL, String(occ.id)),
            {
              active: false,
              cliente: '',
              comensales: 1,
              items: [],
              total: 0,
              nota: '',
              fecha_actualizacion: new Date().toISOString(),
            },
            { merge: true },
          ),
        ),
      );

      // 2. Reset all tables to free, remove ultimo_servicio
      const allTables = await this.tables.getAll();
      await Promise.all(
        allTables.map(table =>
          setDoc(
            docRef(database, companyId, TABLES_COL, String(table.id)),
            { status: 'free', ultimo_servicio: null },
            { merge: true },
          ),
        ),
      );
    },
  };
}

export type FirestoreStore = ReturnType<typeof createFirestoreStore>;
