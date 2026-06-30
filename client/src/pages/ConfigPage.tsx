import { useState, useEffect } from 'react';
import { store, getStoreSource } from '@/services/store';
import type { Product, ProductCategory } from '@/types/models';

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
    <path d="M3.83 16.17l.81-.81a.5.5 0 01.707 0l1.273 1.273a.5.5 0 010 .707l-.81.81a1.5 1.5 0 01-1.98-1.98z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
);

export function ConfigPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<ProductCategory>('bebida');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState<ProductCategory>('bebida');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const fetchProducts = async () => {
    const data = await store.getProducts();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter(p => (p.categoria ?? 'bebida') === tab);

  const addProduct = async () => {
    if (!newName || !newPrice) return;
    await store.createProduct({ nombre: newName, precio: Number(newPrice), categoria: newCat });
    setNewName('');
    setNewPrice('');
    await fetchProducts();
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.nombre);
    setEditPrice(String(product.precio));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    await store.updateProduct(id, { nombre: editName, precio: Number(editPrice) });
    setEditingId(null);
    await fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    await store.deleteProduct(id);
    await fetchProducts();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Catálogo</h1>

      <div className="card space-y-3">
        <h2 className="font-semibold">Productos</h2>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setTab('bebida')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'bebida'
                ? 'bg-white dark:bg-slate-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Bebidas
          </button>
          <button
            onClick={() => setTab('comida')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'comida'
                ? 'bg-white dark:bg-slate-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Comidas
          </button>
        </div>

        {/* Add form */}
        <div className="flex gap-2 flex-wrap">
          <input
            className="input flex-1 min-w-[120px]"
            placeholder="Nombre"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            type="number"
            step="0.01"
            className="input w-20"
            placeholder="Precio"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
          />
          <select
            className="input w-24 text-sm"
            value={newCat}
            onChange={e => setNewCat(e.target.value as ProductCategory)}
          >
            <option value="bebida">Bebida</option>
            <option value="comida">Comida</option>
          </select>
          <button onClick={addProduct} className="btn-primary">Añadir</button>
        </div>

        {/* Product list */}
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {filtered.length === 0 && (
            <li className="py-4 text-sm text-slate-500 text-center">
              No hay productos en esta categoría
            </li>
          )}
          {filtered.map(product => (
            <li key={product.id} className="flex justify-between items-center py-2 gap-2">
              {editingId === product.id ? (
                <>
                  <input
                    className="input flex-1 py-1 text-sm"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="input w-20 py-1 text-sm"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <button onClick={() => saveEdit(product.id)} className="text-green-500 hover:text-green-400 p-1">
                      <CheckIcon />
                    </button>
                    <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-400 p-1">
                      <CloseIcon />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate">{product.nombre}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-medium text-sm">{product.precio.toFixed(2)}€</span>
                    <button onClick={() => startEdit(product)} className="text-blue-400 hover:text-blue-300 p-1">
                      <PencilIcon />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="text-red-400 hover:text-red-300 p-1">
                      <TrashIcon />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
