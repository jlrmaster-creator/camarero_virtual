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
    INSERT INTO products (nombre, precio) VALUES
      -- Cervezas
      ('Caña / Tubo', 2.80),
      ('Cerveza Doble', 3.80),
      ('Cerveza Jarra', 4.50),
      ('Cerveza Sin Alcohol Caña', 2.50),
      ('Cerveza Sin Alcohol Doble', 3.50),
      ('Cerveza de Grifo Especial', 4.00),
      ('Mahou Cinco Estrellas', 3.00),
      ('Estrella Galicia', 3.00),
      ('Alhambra Reserva', 3.50),
      ('Heineken', 3.00),
      ('Paulaner', 4.00),
      ('Frankenweizen', 4.00),
      -- Refrescos
      ('Coca-Cola', 2.50),
      ('Coca-Cola Zero', 2.50),
      ('Fanta Naranja', 2.50),
      ('Fanta Limón', 2.50),
      ('Sprite', 2.50),
      ('Nestea', 2.50),
      ('Aquarius', 2.50),
      ('Tónica Schweppes', 2.80),
      ('Ginger Ale', 2.80),
      ('Bitter Kas', 2.50),
      ('Agua Mineral 500ml', 1.50),
      ('Agua Mineral 1L', 2.50),
      ('Agua con Gas 500ml', 1.80),
      -- Cafés e infusiones
      ('Café Solo', 1.50),
      ('Café Cortado', 1.60),
      ('Café con Leche', 1.80),
      ('Café Bombón', 2.00),
      ('Café Irlandés', 5.00),
      ('Café Carajillo', 3.50),
      ('Descafeinado', 1.60),
      ('Té Negro', 1.50),
      ('Té Verde', 1.50),
      ('Té Rojo', 1.50),
      ('Manzanilla', 1.50),
      ('Tila', 1.50),
      ('Infusión Digestiva', 1.80),
      -- Zumos y batidos
      ('Zumo de Naranja Natural', 3.00),
      ('Zumo de Piña', 2.50),
      ('Zumo de Melocotón', 2.50),
      ('Batido de Fresa', 3.50),
      ('Batido de Chocolate', 3.50),
      ('Batido de Vainilla', 3.50),
      -- Combinados y licores
      ('Ginebra + Tónica', 8.00),
      ('Ron + Cola', 7.00),
      ('Vodka + Naranja', 7.00),
      ('Whisky + Cola', 8.00),
      ('Gin Tonic Premium', 10.00),
      ('Mojito', 7.00),
      ('Cuba Libre', 7.00),
      ('Destornillador', 7.00),
      ('Ginebra (vaso)', 5.00),
      ('Whisky (vaso)', 5.00),
      ('Ron (vaso)', 4.00),
      ('Vodka (vaso)', 4.00),
      -- Vinos y cavas
      ('Vino Tinto Copa', 3.00),
      ('Vino Blanco Copa', 3.00),
      ('Vino Rosado Copa', 3.00),
      ('Cava Brut Copa', 3.50),
      ('Vino Tinto Botella', 12.00),
      ('Vino Blanco Botella', 12.00),
      ('Cava Botella', 15.00),
      -- Chupitos
      ('Chupito de Whisky', 2.50),
      ('Chupito de Ron', 2.00),
      ('Chupito de Vodka', 2.00),
      ('Chupito de Licor de Hierbas', 2.00),
      ('Chupito de Baileys', 2.50),
      ('Chupito de Pacharán', 2.00),
      ('Chupito de Tequila', 2.50),
      -- Aperitivos y vinos generosos
      ('Fino / Manzanilla', 2.50),
      ('Vermut Rojo', 2.80),
      ('Vermut Blanco', 2.80),
      ('Martini Seco', 3.00),
      ('Pacharán', 3.00),
      -- Bebidas no alcohólicas adultas
      ('Cerveza 0,0 Tostada', 3.00),
      ('Kombucha', 3.00),
      ('Refresco de Jengibre', 2.50),
      -- Comidas / raciones
      ('Tortilla de Patatas', 8.00),
      ('Tostada con Tomate', 3.50),
      ('Tostada con Jamón', 4.50),
      ('Sandwich Mixto', 5.00),
      ('Sandwich Vegetal', 5.50),
      ('Bocadillo de Jamón', 6.00),
      ('Bocadillo de Queso', 5.00),
      ('Nachos con Queso', 6.00),
      ('Patatas Fritas', 3.00),
      ('Aceitunas', 2.50),
      ('Frutos Secos', 3.00),
      ('Ensalada Mixta', 7.00),
      ('Tabla de Quesos', 10.00),
      ('Tabla de Embutidos', 10.00)
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
