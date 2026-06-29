# CamareroVirtual

Aplicación web progresiva (PWA) para la gestión de mesas de bares y restaurantes.

## Características

- Gestión de 60 mesas (30 interior + 30 terraza) con pestañas independientes
- Control de camareros por jornada laboral
- Comandas con autocompletado de productos
- Catálogo de productos con precios
- Auto-guardado en cada cambio
- Generación de ticket PDF
- Modo claro/oscuro
- Diseño responsive (móvil, tablet, escritorio)
- Instalable como PWA en la pantalla de inicio

## Stack Tecnológico

- **Frontend**: React 18, Vite 5, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Base de datos**: SQLite (better-sqlite3)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/jlrmaster-creator/camarero_virtual.git
cd camarero_virtual

# Instalar dependencias
npm install

# Inicializar base de datos
npm run db:reset

# Iniciar desarrollo
npm run dev
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor y cliente en desarrollo |
| `npm run build` | Compila el cliente para producción |
| `npm run lint` | Ejecuta linter en cliente y servidor |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm run test` | Ejecuta todos los tests |
| `npm run db:migrate` | Ejecuta migraciones SQLite |
| `npm run db:seed` | Pobla la base de datos con datos iniciales |
| `npm run db:reset` | Reinicia la base de datos por completo |

## Estructura del proyecto

```
/client              # Frontend React
  /src
    /components      # Componentes UI
    /pages           # Páginas de la aplicación
    /hooks           # Hooks personalizados
    /services        # Cliente API
    /context         # Proveedores de contexto
    /types           # Tipos TypeScript
/server              # Backend Express
  /src
    /routes          # Definiciones de rutas
    /controllers     # Manejadores de peticiones
    /models          # Capa de acceso a datos
    /database        # Migraciones, semillas, conexión
    /middleware       # Middleware Express
/public              # Assets estáticos, manifest, SW
```

## Despliegue (GitHub Pages)

Cada push a `main` despliega automáticamente el frontend en GitHub Pages mediante el workflow `.github/workflows/deploy.yml`.

1. Ir a Settings → Pages → Source: **GitHub Actions**
2. El workflow construye el cliente con Vite y lo publica en la rama `gh-pages`
3. La app se sirve en `https://jlrmaster-creator.github.io/camarero_virtual/`

> Nota: El backend (Express + SQLite) no se despliega en GitHub Pages.
> Para producción completa, desplegar el servidor en un VPS o servicio que soporte Node.js.

## API

Endpoints REST bajo `/api/`:

- `GET /api/tables` — Lista de mesas
- `GET /api/tables/:id` — Detalle de mesa
- `PUT /api/tables/:id` — Actualizar mesa
- `POST /api/occupations` — Crear ocupación
- `PUT /api/occupations/:id` — Actualizar ocupación
- `DELETE /api/occupations/:id/finish` — Finalizar ocupación
- `GET /api/products` — Lista de productos (con `?q=` para búsqueda)
- `POST /api/products` — Crear producto
- `PUT /api/products/:id` — Actualizar producto
- `DELETE /api/products/:id` — Eliminar producto
- `GET /api/waiters` — Lista de camareros
- `POST /api/waiters` — Crear camarero
- `POST /api/waiters/:id/start` — Iniciar jornada
- `POST /api/waiters/:id/end` — Cerrar jornada

## Licencia

MIT
