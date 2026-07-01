# CamareroVirtual

Aplicación web progresiva (PWA) para la gestión de mesas de bares y restaurantes.

## Características

- Gestión de 60 mesas (30 interior + 30 terraza) con pestañas independientes
- Control de camareros por jornada laboral (inicio/fin de turno)
- **Múltiples grupos por mesa** — Varios clientes/grupos (ej. "Familia 01" + "Familia 02") con pedidos y subtotales independientes
- Comandas con autocompletado de productos desde catálogo
- Catálogo de productos con precios editable
- Auto-guardado en cada cambio
- Ticket en modal con zoom, desglose por grupo y QR
- Administración: reset de mesas (pedidos, no catálogo)
- Autenticación con Firebase (admin + camareros)
- Roles: admin (gestión completa) y waiter (solo servicio)
- Bloqueo de mesas entre camareros
- Firebase como única fuente de datos
- Modo claro/oscuro
- Diseño responsive (móvil, tablet, escritorio)
- Instalable como PWA en la pantalla de inicio
- Recuperación automática ante actualizaciones del Service Worker

## Stack Tecnológico

- **Frontend**: React 18, Vite 5, TypeScript, TailwindCSS
- **Cloud**: Firebase Authentication + Firestore
- **PWA**: Service Worker con estrategia network-first para HTML, cache-first para assets

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/jlrmaster-creator/camarero_virtual.git
cd camarero_virtual

# Instalar dependencias
npm install

# Inicializar base de datos (modo local)
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
/client              # Frontend React (Vite)
  /src
    /components      # Componentes UI reutilizables
    /pages           # Páginas de la aplicación
    /hooks           # Hooks personalizados (useTables, etc.)
    /services        # Cliente API, store, Firebase
    /context         # Proveedores de contexto (Auth, DataSource, Waiter)
    /types           # Tipos TypeScript compartidos
    /firebase        # Configuración e inicialización de Firebase
/public              # Assets estáticos, manifest, SW, recover.html
/server              # Backend Express (opcional, para modo local)
  /src
    /routes          # Definiciones de rutas
    /controllers     # Manejadores de peticiones
    /models          # Capa de acceso a datos (better-sqlite3)
    /database        # Migraciones, semillas, conexión
    /middleware       # Middleware Express
/.github/workflows   # CI/CD (deploy a GitHub Pages)
firestore.rules      # Reglas de seguridad de Firestore
```

## Fuentes de datos

La aplicación detecta automáticamente la fuente disponible:

1. **Firebase** (prioritaria) — Si hay credenciales de Firebase configuradas. Requiere autenticación.
2. **API local** — Si el servidor Express está corriendo en local.
3. **Local storage** — Fallback, datos en el navegador.

## Autenticación

- **Registro**: El primer usuario crea una empresa y queda como admin.
- **Admin**: Puede crear camareros, gestionar productos, ver informes.
- **Waiter**: Puede servir mesas, crear comandas, iniciar/cerrar turno.
- Los usuarios bloqueados/eliminados no pueden acceder.

## PWA / Service Worker

- **Estrategia**: Network-first para navegaciones (HTML siempre fresco), cache-first para assets estáticos (JS, CSS, fuentes).
- **Actualizaciones**: Cuando se detecta un nuevo SW, se muestra un toast con opción a actualizar. Si no hay interacción, se auto-actualiza a los 30s.
- **Script inline**: El `index.html` incluye un script que activa automáticamente cualquier SW en espera, rompiendo el ciclo de página en blanco tras un deploy.
- **Recuperación**: Navegar a `/recover.html` fuerza la activación del nuevo SW y redirige a la página principal.
- **HTML no cacheado**: El install del SW solo precachea `manifest.json`. El HTML nunca se sirve desde caché.
- **Clone seguro**: Las respuestas se clonan sincrónicamente para evitar el error "Response body already used".
- **findInCaches**: Busca en todas las cachés (nuevas y viejas) antes de ir a red, dando un periodo de transición de 60s tras activación.

## Despliegue (GitHub Pages)

Cada push a `main` con código fuente (sin `[skip ci]`) dispara el workflow `.github/workflows/deploy.yml` que:
1. Incrementa la versión en `client/package.json`
2. Inyecta la versión en `public/sw.js`
3. Construye el frontend con Vite
4. Copia el build a `docs/`
5. Commitea `docs/` y `client/package.json` con `[skip ci]`
6. GitHub Pages despliega desde `main` → `/docs`

La app se sirve en `https://jlrmaster-creator.github.io/camarero_virtual/`

> Nota: El backend (Express + SQLite) no se despliega en GitHub Pages.
> En modo Firebase no es necesario backend propio.

## API (modo local)

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
