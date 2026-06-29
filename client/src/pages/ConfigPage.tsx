import { useState, useEffect } from 'react';
import { productsService } from '@/services/products';
import type { Product } from '@/types/models';

export function ConfigPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const fetchProducts = async () => {
    const data = await productsService.getAll();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async () => {
    if (!newName || !newPrice) return;
    await productsService.create({ nombre: newName, precio: Number(newPrice) });
    setNewName('');
    setNewPrice('');
    await fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    await productsService.delete(id);
    await fetchProducts();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Configuración</h1>

      <div className="card space-y-3">
        <h2 className="font-semibold">Catálogo de Productos</h2>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Producto"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            type="number"
            step="0.01"
            className="input w-24"
            placeholder="Precio"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
          />
          <button onClick={addProduct} className="btn-primary">Añadir</button>
        </div>

        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {products.map(product => (
            <li key={product.id} className="flex justify-between items-center py-2">
              <span>{product.nombre}</span>
              <div className="flex items-center gap-3">
                <span className="font-medium">{product.precio.toFixed(2)}€</span>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="text-red-500 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
