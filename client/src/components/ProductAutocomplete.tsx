import { useState, useRef, useEffect } from 'react';
import { store } from '@/services/store';
import type { Product } from '@/types/models';

interface ProductAutocompleteProps {
  onAddProduct: (product: Product) => void;
  disabled?: boolean;
}

export function ProductAutocomplete({ onAddProduct, disabled }: ProductAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length >= 1) {
      store.getProducts(query).then(setSuggestions).catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const addProduct = (product: Product) => {
    onAddProduct(product);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      addProduct(suggestions[selectedIndex]);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setShowSuggestions(true); setSelectedIndex(-1); }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={handleKeyDown}
        className="input"
        placeholder="Buscar producto..."
        disabled={disabled}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((product, i) => (
            <li
              key={product.id}
              onMouseDown={() => addProduct(product)}
              className={`px-3 py-2 cursor-pointer text-sm flex justify-between ${
                i === selectedIndex ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              <span>{product.nombre}</span>
              <span className="text-slate-500">{product.precio.toFixed(2)}€</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
