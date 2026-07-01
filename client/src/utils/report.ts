import type { Occupation, OrderItem, GrupoPedido } from '@/types/models';

interface ProductCount {
  nombre: string;
  cantidad: number;
  totalVendido: number;
}

function getAllItems(occ: Occupation): OrderItem[] {
  if (occ.grupos && occ.grupos.length > 0) {
    return occ.grupos.flatMap((g: GrupoPedido) => g.items);
  }
  return occ.items ?? [];
}

function calcTotal(occ: Occupation): number {
  return getAllItems(occ).reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

function safeCliente(cliente: string | undefined, grupos?: GrupoPedido[]): string {
  const c = (cliente && cliente !== 'undefined' ? cliente : '')
    || (grupos?.[0]?.nombre ?? '');
  return c;
}

function isToday(isoStr: string): boolean {
  const d = new Date(isoStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

export function generateReportHtml(params: {
  companyName?: string;
  occupations: Occupation[];
  activeOccupations?: Occupation[];
  waiterNames: Record<number | string, string>;
  tableNames: Record<number, string>;
}): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const title = params.companyName || 'Informe del día';

  // Filter today's finished occupations
  const todayOccs = params.occupations.filter(o => isToday(o.fecha_actualizacion));

  // Product count
  const productMap = new Map<string, ProductCount>();
  for (const occ of todayOccs) {
    for (const item of getAllItems(occ)) {
      const existing = productMap.get(item.nombre);
      if (existing) {
        existing.cantidad += item.cantidad;
        existing.totalVendido += item.precio * item.cantidad;
      } else {
        productMap.set(item.nombre, {
          nombre: item.nombre,
          cantidad: item.cantidad,
          totalVendido: item.precio * item.cantidad,
        });
      }
    }
  }
  const productRows = Array.from(productMap.values()).sort((a, b) => b.totalVendido - a.totalVendido);

  // Per-waiter summary
  const waiterMap = new Map<number | string, { nombre: string; total: number; count: number }>();
  for (const occ of todayOccs) {
    const wid = occ.waiter_id ?? 0;
    const name = params.waiterNames[wid] || `Camarero #${wid}`;
    const existing = waiterMap.get(wid);
    const t = calcTotal(occ);
    if (existing) {
      existing.total += t;
      existing.count += 1;
    } else {
      waiterMap.set(wid, { nombre: name, total: t, count: 1 });
    }
  }
  const waiterRows = Array.from(waiterMap.values()).sort((a, b) => b.total - a.total);

  // Per-table detail (finished)
  const tableRows = todayOccs
    .map(occ => {
      const tableName = params.tableNames[occ.table_id] || `Mesa ${occ.table_id}`;
      const t = calcTotal(occ);
      const waiterName = params.waiterNames[occ.waiter_id ?? 0] || '—';
      const cliente = safeCliente(occ.cliente, occ.grupos);
      return { tableName, waiterName, cliente, total: t };
    })
    .sort((a, b) => b.total - a.total);

  // En curso (active occupations)
  const activeRows = (params.activeOccupations ?? [])
    .map(occ => {
      const tableName = params.tableNames[occ.table_id] || `Mesa ${occ.table_id}`;
      const t = calcTotal(occ);
      const waiterName = params.waiterNames[occ.waiter_id ?? 0] || '—';
      const cliente = safeCliente(occ.cliente, occ.grupos);
      return { tableName, waiterName, cliente, total: t };
    })
    .sort((a, b) => b.total - a.total);

  const totalServicios = todayOccs.length;
  const totalFacturado = todayOccs.reduce((sum, occ) => sum + calcTotal(occ), 0);

  const productHtml = productRows.map(p =>
    `<tr><td>${p.nombre}</td><td class="num">${p.cantidad}</td><td class="num">${p.totalVendido.toFixed(2)}€</td></tr>`
  ).join('\n');

  const waiterHtml = waiterRows.map(w =>
    `<tr><td>${w.nombre}</td><td class="num">${w.count}</td><td class="num">${w.total.toFixed(2)}€</td></tr>`
  ).join('\n');

  const tableHtml = tableRows.map(t =>
    `<tr><td>${t.tableName}</td><td>${t.waiterName}</td><td>${t.cliente}</td><td class="num">${t.total.toFixed(2)}€</td></tr>`
  ).join('\n');

  const activeHtml = activeRows.map(t =>
    `<tr><td>${t.tableName}</td><td>${t.waiterName}</td><td>${t.cliente}</td><td class="num">${t.total.toFixed(2)}€</td></tr>`
  ).join('\n');

  const showActive = activeRows.length > 0;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; max-width: 800px; margin: 0 auto; padding: 24px 16px; background: #fff; color: #222; }
  h1 { text-align: center; font-size: 24px; margin: 0 0 4px; }
  .date { text-align: center; font-size: 15px; color: #666; margin-bottom: 24px; }
  h2 { font-size: 18px; margin: 24px 0 12px; border-bottom: 2px solid #333; padding-bottom: 4px; }
  .resumen { display: flex; gap: 24px; justify-content: center; margin: 16px 0 24px; }
  .resumen-item { text-align: center; background: #f5f5f5; border-radius: 8px; padding: 12px 24px; }
  .resumen-item .val { font-size: 28px; font-weight: bold; }
  .resumen-item .lab { font-size: 13px; color: #666; }
  .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 999px; margin-left: 8px; font-weight: 400; }
  .badge-active { background: #e8f5e9; color: #2e7d32; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
  th { background: #f0f0f0; font-weight: 600; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row td { font-weight: bold; border-top: 2px solid #333; }
  .footer { text-align: center; font-size: 13px; color: #888; margin-top: 32px; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <h1>${title}</h1>
  <div class="date">${dateStr}</div>

  <div class="resumen">
    <div class="resumen-item">
      <div class="val">${totalFacturado.toFixed(2)}€</div>
      <div class="lab">Total facturado</div>
    </div>
    <div class="resumen-item">
      <div class="val">${totalServicios}</div>
      <div class="lab">Servicios</div>
    </div>
    <div class="resumen-item">
      <div class="val">${productRows.length}</div>
      <div class="lab">Productos distintos</div>
    </div>
  </div>

  <h2>Productos vendidos (control de stock)</h2>
  <table>
    <thead><tr><th>Producto</th><th class="num">Unidades</th><th class="num">Total</th></tr></thead>
    <tbody>${productHtml}</tbody>
  </table>

  <h2>Resumen por camarero</h2>
  <table>
    <thead><tr><th>Camarero</th><th class="num">Servicios</th><th class="num">Total</th></tr></thead>
    <tbody>${waiterHtml}</tbody>
  </table>

  <h2>Detalle por mesa</h2>
  <table>
    <thead><tr><th>Mesa</th><th>Camarero</th><th>Cliente</th><th class="num">Total</th></tr></thead>
    <tbody>${tableHtml}</tbody>
  </table>

  ${showActive ? `
  <h2>En curso <span class="badge badge-active">${activeRows.length} mesas</span></h2>
  <table>
    <thead><tr><th>Mesa</th><th>Camarero</th><th>Cliente</th><th class="num">Total</th></tr></thead>
    <tbody>${activeHtml}</tbody>
  </table>` : ''}

  <div class="footer">Generado por Camarero Virtual</div>
</body></html>`;
}

export function printReport(html: string): void {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
}
