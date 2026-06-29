import { useState, useRef, useEffect } from 'react';
import { productsService } from '@/services/products';
import type { Product } from '@/types/models';

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddProduct?: (product: Product) => void;
}

export function ProductAutocomplete({ value, onChange, onAddProduct }: ProductAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const lastLine = value.split('\n').pop() ?? '';
    const words = lastLine.split(/\s+/);
    const searchTerm = words[words.length - 1];

    if (searchTerm.length >= 2) {
      productsService.getAll(searchTerm).then(setSuggestions).catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [value]);

  const insertProduct = (product: Product) => {
    const lines = value.split('\n');
    const lastLine = lines.pop() ?? '';
    const words = lastLine.split(/\s+/);
    words[words.length - 1] = `${product.nombre} — ${product.precio.toFixed(2)}€`;
    lines.push(words.join(' '));
    onChange(lines.join('\n'));
    setShowSuggestions(false);
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
      insertProduct(suggestions[selectedIndex]);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={handleKeyDown}
        className="input min-h-[120px] resize-y"
        placeholder="Escribe la comanda..."
        rows={6}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((product, i) => (
            <li
              key={product.id}
              onMouseDown={() => insertProduct(product)}
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
