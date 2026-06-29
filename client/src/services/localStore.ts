import type { Table, Occupation, Product, Waiter, TableStatus, Zone } from '@/types/models';

const TABLES_KEY = 'local_tables';
const PRODUCTS_KEY = 'local_products';
const OCCUPATIONS_KEY = 'local_occupations';
const WAITERS_KEY = 'local_waiters';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function strip<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Internal flag for finished occupations (not part of the Occupation type)
type OccupationInternal = Occupation & { _finished?: boolean };

// --- Default data ---

const DEFAULT_TABLES: Table[] = [
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 1, zone: 'interior' as Zone, numero: i + 1,
    nombre: `Mesa I${100 + i + 1}`, status: 'free' as TableStatus,
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    id: 31 + i, zone: 'terraza' as Zone, numero: i + 1,
    nombre: `Mesa EXT${200 + i + 1}`, status: 'free' as TableStatus,
  })),
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, nombre: 'Caña / Tubo', precio: 2.80 },
  { id: 2, nombre: 'Cerveza Doble', precio: 3.80 },
  { id: 3, nombre: 'Cerveza Jarra', precio: 4.50 },
  { id: 4, nombre: 'Cerveza Sin Alcohol Caña', precio: 2.50 },
  { id: 5, nombre: 'Mahou Cinco Estrellas', precio: 3.00 },
  { id: 6, nombre: 'Estrella Galicia', precio: 3.00 },
  { id: 7, nombre: 'Coca-Cola', precio: 2.50 },
  { id: 8, nombre: 'Coca-Cola Zero', precio: 2.50 },
  { id: 9, nombre: 'Fanta Naranja', precio: 2.50 },
  { id: 10, nombre: 'Fanta Limón', precio: 2.50 },
  { id: 11, nombre: 'Agua Mineral 500ml', precio: 1.50 },
  { id: 12, nombre: 'Agua con Gas 500ml', precio: 1.80 },
  { id: 13, nombre: 'Café Solo', precio: 1.50 },
  { id: 14, nombre: 'Café con Leche', precio: 1.80 },
  { id: 15, nombre: 'Café Bombón', precio: 2.00 },
  { id: 16, nombre: 'Té Negro', precio: 1.50 },
  { id: 17, nombre: 'Manzanilla', precio: 1.50 },
  { id: 18, nombre: 'Zumo de Naranja Natural', precio: 3.00 },
  { id: 19, nombre: 'Tortilla de Patatas', precio: 8.00 },
  { id: 20, nombre: 'Sandwich Mixto', precio: 5.00 },
  { id: 21, nombre: 'Patatas Fritas', precio: 3.00 },
  { id: 22, nombre: 'Ginebra + Tónica', precio: 8.00 },
  { id: 23, nombre: 'Ron + Cola', precio: 7.00 },
  { id: 24, nombre: 'Vino Tinto Copa', precio: 3.00 },
  { id: 25, nombre: 'Cava Brut Copa', precio: 3.50 },
];

// --- Tables ---

export const localTables = {
  getAll(zone?: Zone): Table[] {
    let tables = load<Table[]>(TABLES_KEY, []);
    if (tables.length === 0) {
      tables = strip(DEFAULT_TABLES);
      save(TABLES_KEY, tables);
    }
    if (zone) return tables.filter(t => t.zone === zone);
    return tables;
  },

  getById(id: number): Table | undefined {
    return this.getAll().find(t => t.id === id);
  },

  update(id: number, data: Partial<Table>): Table | undefined {
    const tables = this.getAll();
    const idx = tables.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    tables[idx] = { ...tables[idx], ...data };
    save(TABLES_KEY, tables);
    return tables[idx];
  },
};

// --- Products ---

export const localProducts = {
  getAll(q?: string): Product[] {
    let products = load<Product[]>(PRODUCTS_KEY, []);
    if (products.length === 0) {
      products = strip(DEFAULT_PRODUCTS);
      save(PRODUCTS_KEY, products);
    }
    if (q) return products.filter(p => p.nombre.toLowerCase().includes(q.toLowerCase()));
    return products;
  },

  create(data: { nombre: string; precio: number }): Product {
    const products = this.getAll();
    const product: Product = { id: generateId(), ...data };
    products.push(product);
    save(PRODUCTS_KEY, products);
    return product;
  },

  update(id: number, data: Partial<Product>): Product | undefined {
    const products = this.getAll();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    products[idx] = { ...products[idx], ...data };
    save(PRODUCTS_KEY, products);
    return products[idx];
  },

  delete(id: number): boolean {
    const products = this.getAll().filter(p => p.id !== id);
    const before = load<Product[]>(PRODUCTS_KEY, []).length;
    save(PRODUCTS_KEY, products);
    return products.length < before;
  },
};

// --- Occupations ---

export const localOccupations = {
  getAll(): Occupation[] {
    return load<Occupation[]>(OCCUPATIONS_KEY, []);
  },

  getByTableId(tableId: number): Occupation | undefined {
    const occupations = this.getAll() as OccupationInternal[];
    return occupations.find(o => o.table_id === tableId && !o._finished);
  },

  create(data: { table_id: number; waiter_id?: number | null; cliente?: string; comensales?: number; nota?: string }): Occupation {
    const occupations = this.getAll();
    const occupation: Occupation = {
      id: generateId(),
      table_id: data.table_id,
      waiter_id: data.waiter_id ?? null,
      cliente: data.cliente ?? '',
      comensales: data.comensales ?? 1,
      nota: data.nota ?? '',
      total: 0,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      fecha_expiracion: new Date(Date.now() + 48 * 3600000).toISOString(),
    } as Occupation;
    occupations.push(occupation);
    save(OCCUPATIONS_KEY, occupations);
    return occupation;
  },

  update(id: number, data: Partial<Occupation>): Occupation | undefined {
    const occupations = this.getAll();
    const idx = occupations.findIndex(o => o.id === id);
    if (idx === -1) return undefined;
    occupations[idx] = {
      ...occupations[idx],
      ...data,
      fecha_actualizacion: new Date().toISOString(),
    };
    save(OCCUPATIONS_KEY, occupations);
    return occupations[idx];
  },

  finish(id: number): boolean {
    const occupation = this.getAll().find(o => o.id === id);
    if (!occupation) return false;
    this.delete(id);
    return true;
  },

  delete(id: number): void {
    const occupations = this.getAll().filter(o => o.id !== id);
    save(OCCUPATIONS_KEY, occupations);
  },
};

// --- Waiters ---

export const localWaiters = {
  getAll(activo?: boolean): Waiter[] {
    let waiters = load<Waiter[]>(WAITERS_KEY, []);
    if (activo !== undefined) return waiters.filter(w => w.activo === activo);
    return waiters;
  },

  create(nombre: string): Waiter {
    const waiters = this.getAll();
    const waiter: Waiter = {
      id: generateId(),
      nombre,
      activo: false,
      fecha_inicio: null,
      fecha_fin: null,
    };
    waiters.push(waiter);
    save(WAITERS_KEY, waiters);
    return waiter;
  },

  startShift(id: number): Waiter | undefined {
    const waiters = this.getAll();
    const idx = waiters.findIndex(w => w.id === id);
    if (idx === -1) return undefined;
    waiters[idx] = { ...waiters[idx], activo: true, fecha_inicio: new Date().toISOString() };
    save(WAITERS_KEY, waiters);
    return waiters[idx];
  },

  endShift(id: number): Waiter | undefined {
    const waiters = this.getAll();
    const idx = waiters.findIndex(w => w.id === id);
    if (idx === -1) return undefined;
    waiters[idx] = { ...waiters[idx], activo: false, fecha_fin: new Date().toISOString() };
    save(WAITERS_KEY, waiters);
    return waiters[idx];
  },
};
