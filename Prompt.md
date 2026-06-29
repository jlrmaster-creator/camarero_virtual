# CamareroVirtual — Documento de Requisitos (Actualizado)

Aplicación web progresiva (PWA) para la gestión de mesas de un bar/restaurante.
Optimizada para uso desde móvil, funciona en tablet y escritorio.

---

## Stack Tecnológico (Implementado)

- **Frontend**: React 18, Vite 5, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript, SQLite (better-sqlite3)
- **Cloud**: Firebase Authentication + Firestore
- **PWA**: Service Worker propio (no librerías), manifest v2

> Desviación de la especificación original: Se añadió Firebase como fuente de datos
> opcional para permitir uso multidispositivo sin servidor propio. La app sigue
> funcionando en modo 100% local (Express + SQLite o localStorage).

---

## Fuentes de datos (orden de prioridad)

1. **Firebase** — Si hay credenciales configuradas. Requiere autenticación.
2. **API local** — Si el servidor Express está corriendo.
3. **LocalStorage** — Fallback en el navegador.

---

## Autenticación (Firebase Auth)

- Login con email y contraseña.
- Roles: **admin** (gestión completa) y **waiter** (solo servicio).
- El primer usuario registra una empresa y obtiene rol admin.
- Los admin pueden crear/editar/bloquear/eliminar camareros.
- Los usuarios bloqueados o eliminados no pueden acceder.
- Las reglas de Firestore (`firestore.rules`) controlan el acceso a nivel de documento.

---

## Gestión de camareros

- Pantalla de inicio de turno con selección de camarero.
- Cada mesa ocupada por un camarero queda bloqueada para otros.
- Al cerrar turno, se persiste el estado.
- Los admin pueden gestionar camareros desde el panel de administración.

---

## Gestión de mesas

- 30 mesas interior (I101–I130) + 30 terraza (EXT201–EXT230).
- Cuadrícula con tarjetas grandes, apta para móvil.
- Colores por estado: verde (libre), rojo (ocupada), gris (pendiente pago), etc.
- Pestañas para cambiar entre interior y terraza.
- Nombre de mesa editable desde configuración.

---

## Comandas

- Al pulsar una mesa ocupada se abre el detalle.
- Catálogo de productos con autocompletado.
- Notas de texto libre.
- Auto-guardado en cada cambio (sin botón guardar).
- Generación de ticket PDF con detalle y total.
- Envío del PDF por WhatsApp.

---

## Informes

- Cierre de caja: PDF con total por mesa y suma global.
- Envío del PDF por WhatsApp.
- Historial de ocupaciones.

---

## PWA / Service Worker

- Instalable en pantalla de inicio (manifest.json + iconos).
- **Estrategia SW**:
  - Navegaciones HTML: **network-first**, nunca se cachea HTML.
  - Assets estáticos (JS, CSS): **cache-first**, con clon síncrono para evitar race conditions.
  - API: **network-first** con fallback a caché.
- **Actualización automática**: Script inline en `index.html` que activa cualquier SW en espera.
- **Página de recuperación**: `/recover.html` para forzar activación del SW manualmente.
- **findInCaches**: Busca en todas las cachés antes de ir a red, con limpieza diferida 60s.
- **No se precachea HTML** en el install del SW (solo `manifest.json`).

---

## Despliegue

- GitHub Pages desde `main` → `/docs`.
- CI/CD automático con GitHub Actions.
- El workflow incrementa versión, construye, commitea `docs/` y despliega.
- Commits con `[skip ci]` evitan bucles de deploy.
- Solo el frontend estático se despliega (sin backend).

---

## Estados visuales de las mesas

- 🟢 Libre
- 🔴 Ocupada
- ⚪ Pendiente de pago
- Colores definidos con TailwindCSS, fácilmente modificables.

---

## Estructura del proyecto

```
/
├── client/             # React SPA
│   ├── src/
│   │   ├── components/ # Componentes UI
│   │   ├── pages/      # Páginas
│   │   ├── hooks/      # Hooks (useTables, etc.)
│   │   ├── services/   # Store, API, Firebase
│   │   ├── context/    # Auth, DataSource, Waiter
│   │   ├── firebase/   # Config Firebase
│   │   └── types/      # Tipos TypeScript
│   └── index.html      # Entry point + inline SW script
├── server/             # Express API (opcional)
├── public/             # SW, manifest, recover.html
├── docs/               # Build para GitHub Pages (generado)
├── firestore.rules     # Reglas Firestore
└── .github/workflows/  # CI/CD
```

---

## Requisitos no implementados (pendientes)

- Impresión en cocina.
- Exportación a Excel.
- Copias de seguridad automáticas.
- Sincronización entre dispositivos en red local (sin Firebase).
- Eliminación automática de datos tras 48h (actualmente hay que hacerlo manual).
- Pantalla de "facturación parcial".

---

## Notas técnicas

- **TypeScript strict**: `strict: true` sin excepciones.
- **Conventional commits**: `feat:`, `fix:`, `chore:`, etc.
- **Sin any**: Usar `unknown` y type guards.
- **Importaciones**: 1) built-ins/3rd-party, 2) `@/`, 3) relativas.
- **Named exports** preferidas sobre default exports.
- **Vitest** para tests (co-located con source).
- **Sin secrets en código**: Solo `.env` para configuración sensible.
