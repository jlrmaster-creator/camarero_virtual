import { getDb, closeDb } from './connection';
import { runMigrations } from './migrate';

export function runSeed(): void {
  runMigrations();
  const db = getDb();

  const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get() as { count: number };
  if (tableCount.count > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  const insertTable = db.prepare(
    'INSERT INTO tables (zone, numero, nombre) VALUES (?, ?, ?)',
  );

  const insertMany = db.transaction(() => {
    for (let i = 1; i <= 30; i++) {
      insertTable.run('interior', i, `Mesa I${100 + i}`);
    }
    for (let i = 1; i <= 30; i++) {
      insertTable.run('terraza', i, `Mesa EXT${200 + i}`);
    }
  });

  insertMany();

  db.prepare(`
    INSERT INTO products (nombre, precio, categoria) VALUES
      -- Cervezas
      ('Caña / Tubo', 2.80, 'bebida'),
      ('Cerveza Doble', 3.80, 'bebida'),
      ('Cerveza Jarra', 4.50, 'bebida'),
      ('Cerveza Sin Alcohol Caña', 2.50, 'bebida'),
      ('Cerveza Sin Alcohol Doble', 3.50, 'bebida'),
      ('Cerveza de Grifo Especial', 4.00, 'bebida'),
      ('Mahou Cinco Estrellas', 3.00, 'bebida'),
      ('Estrella Galicia', 3.00, 'bebida'),
      ('Alhambra Reserva', 3.50, 'bebida'),
      ('Heineken', 3.00, 'bebida'),
      ('Paulaner', 4.00, 'bebida'),
      ('Frankenweizen', 4.00, 'bebida'),
      -- Refrescos
      ('Coca-Cola', 2.50, 'bebida'),
      ('Coca-Cola Zero', 2.50, 'bebida'),
      ('Fanta Naranja', 2.50, 'bebida'),
      ('Fanta Limón', 2.50, 'bebida'),
      ('Sprite', 2.50, 'bebida'),
      ('Nestea', 2.50, 'bebida'),
      ('Aquarius', 2.50, 'bebida'),
      ('Tónica Schweppes', 2.80, 'bebida'),
      ('Ginger Ale', 2.80, 'bebida'),
      ('Bitter Kas', 2.50, 'bebida'),
      ('Agua Mineral 500ml', 1.50, 'bebida'),
      ('Agua Mineral 1L', 2.50, 'bebida'),
      ('Agua con Gas 500ml', 1.80, 'bebida'),
      -- Cafés e infusiones
      ('Café Solo', 1.50, 'bebida'),
      ('Café Cortado', 1.60, 'bebida'),
      ('Café con Leche', 1.80, 'bebida'),
      ('Café Bombón', 2.00, 'bebida'),
      ('Café Irlandés', 5.00, 'bebida'),
      ('Café Carajillo', 3.50, 'bebida'),
      ('Descafeinado', 1.60, 'bebida'),
      ('Té Negro', 1.50, 'bebida'),
      ('Té Verde', 1.50, 'bebida'),
      ('Té Rojo', 1.50, 'bebida'),
      ('Manzanilla', 1.50, 'bebida'),
      ('Tila', 1.50, 'bebida'),
      ('Infusión Digestiva', 1.80, 'bebida'),
      -- Zumos y batidos
      ('Zumo de Naranja Natural', 3.00, 'bebida'),
      ('Zumo de Piña', 2.50, 'bebida'),
      ('Zumo de Melocotón', 2.50, 'bebida'),
      ('Batido de Fresa', 3.50, 'bebida'),
      ('Batido de Chocolate', 3.50, 'bebida'),
      ('Batido de Vainilla', 3.50, 'bebida'),
      -- Combinados y licores
      ('Ginebra + Tónica', 8.00, 'bebida'),
      ('Ron + Cola', 7.00, 'bebida'),
      ('Vodka + Naranja', 7.00, 'bebida'),
      ('Whisky + Cola', 8.00, 'bebida'),
      ('Gin Tonic Premium', 10.00, 'bebida'),
      ('Mojito', 7.00, 'bebida'),
      ('Cuba Libre', 7.00, 'bebida'),
      ('Destornillador', 7.00, 'bebida'),
      ('Ginebra (vaso)', 5.00, 'bebida'),
      ('Whisky (vaso)', 5.00, 'bebida'),
      ('Ron (vaso)', 4.00, 'bebida'),
      ('Vodka (vaso)', 4.00, 'bebida'),
      -- Vinos y cavas
      ('Vino Tinto Copa', 3.00, 'bebida'),
      ('Vino Blanco Copa', 3.00, 'bebida'),
      ('Vino Rosado Copa', 3.00, 'bebida'),
      ('Cava Brut Copa', 3.50, 'bebida'),
      ('Vino Tinto Botella', 12.00, 'bebida'),
      ('Vino Blanco Botella', 12.00, 'bebida'),
      ('Cava Botella', 15.00, 'bebida'),
      -- Chupitos
      ('Chupito de Whisky', 2.50, 'bebida'),
      ('Chupito de Ron', 2.00, 'bebida'),
      ('Chupito de Vodka', 2.00, 'bebida'),
      ('Chupito de Licor de Hierbas', 2.00, 'bebida'),
      ('Chupito de Baileys', 2.50, 'bebida'),
      ('Chupito de Pacharán', 2.00, 'bebida'),
      ('Chupito de Tequila', 2.50, 'bebida'),
      -- Aperitivos y vinos generosos
      ('Fino / Manzanilla', 2.50, 'bebida'),
      ('Vermut Rojo', 2.80, 'bebida'),
      ('Vermut Blanco', 2.80, 'bebida'),
      ('Martini Seco', 3.00, 'bebida'),
      ('Pacharán', 3.00, 'bebida'),
      -- Bebidas no alcohólicas adultas
      ('Cerveza 0,0 Tostada', 3.00, 'bebida'),
      ('Kombucha', 3.00, 'bebida'),
      ('Refresco de Jengibre', 2.50, 'bebida'),
      -- Comidas / raciones
      ('Tortilla de Patatas', 8.00, 'comida'),
      ('Tostada con Tomate', 3.50, 'comida'),
      ('Tostada con Jamón', 4.50, 'comida'),
      ('Sandwich Mixto', 5.00, 'comida'),
      ('Sandwich Vegetal', 5.50, 'comida'),
      ('Bocadillo de Jamón', 6.00, 'comida'),
      ('Bocadillo de Queso', 5.00, 'comida'),
      ('Nachos con Queso', 6.00, 'comida'),
      ('Patatas Fritas', 3.00, 'comida'),
      ('Aceitunas', 2.50, 'comida'),
      ('Frutos Secos', 3.00, 'comida'),
      ('Ensalada Mixta', 7.00, 'comida'),
      ('Tabla de Quesos', 10.00, 'comida'),
      ('Tabla de Embutidos', 10.00, 'comida')
    ON CONFLICT(nombre) DO NOTHING
  `).run();

  console.log('Seed completed: 60 tables + 100 products created.');
}

const isMain = process.argv[1]?.includes('seed');
if (isMain) {
  try {
    runSeed();
  } finally {
    closeDb();
  }
}
