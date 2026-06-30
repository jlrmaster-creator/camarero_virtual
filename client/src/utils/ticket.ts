export function generateTicket(params: {
  tableName: string;
  zone: string;
  waiterName: string;
  cliente: string;
  comensales: number;
  nota: string;
  total: number;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES');
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Ticket</title>
<style>
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 8px; }
  h2 { text-align: center; font-size: 16px; margin: 0 0 4px; }
  hr { border: none; border-top: 1px dashed #333; margin: 6px 0; }
  .header { text-align: center; font-size: 11px; margin-bottom: 6px; }
  .row { display: flex; justify-content: space-between; }
  .total { font-size: 16px; font-weight: bold; text-align: center; margin: 8px 0; }
  .footer { text-align: center; font-size: 10px; margin-top: 8px; color: #555; }
</style></head>
<body>
  <h2>Camarero Virtual</h2>
  <div class="header">${dateStr} ${timeStr}</div>
  <hr>
  <div class="row"><span>Mesa:</span><span>${params.tableName}</span></div>
  <div class="row"><span>Zona:</span><span>${params.zone}</span></div>
  <div class="row"><span>Camarero:</span><span>${params.waiterName}</span></div>
  ${params.cliente ? `<div class="row"><span>Cliente:</span><span>${params.cliente}</span></div>` : ''}
  <div class="row"><span>Comensales:</span><span>${params.comensales}</span></div>
  <hr>
  <div style="white-space:pre-wrap;font-size:11px;">${params.nota}</div>
  <hr>
  <div class="total">TOTAL: ${params.total.toFixed(2)}€</div>
  <hr>
  <div class="footer">¡Gracias por su visita!</div>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }
}
