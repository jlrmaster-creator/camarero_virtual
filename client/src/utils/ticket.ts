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

  const qrData = encodeURIComponent(
    `Mesa: ${params.tableName} (${params.zone})\n` +
    `Fecha: ${dateStr} ${timeStr}\n` +
    `Camarero: ${params.waiterName}\n` +
    `${params.cliente ? `Cliente: ${params.cliente}\n` : ''}` +
    `Total: ${params.total.toFixed(2)}€`
  );

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ticket</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 16px; max-width: 480px; margin: 0 auto; padding: 24px 16px; background: #fff; color: #222; }
  h2 { text-align: center; font-size: 24px; margin: 0 0 8px; }
  .header { text-align: center; font-size: 14px; color: #666; margin-bottom: 16px; }
  hr { border: none; border-top: 1px dashed #999; margin: 12px 0; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 16px; }
  .items { font-size: 15px; line-height: 1.6; padding: 4px 0; }
  .total { font-size: 28px; font-weight: bold; text-align: center; margin: 16px 0; }
  .qr { text-align: center; margin-top: 24px; }
  .qr img { width: 180px; height: 180px; }
  .qr-label { font-size: 12px; color: #999; margin-top: 4px; }
  .footer { text-align: center; font-size: 14px; margin-top: 16px; color: #888; }
</style></head>
<body>
  <h2>Camarero Virtual</h2>
  <div class="header">${dateStr} &middot; ${timeStr}</div>
  <hr>
  <div class="row"><span>Mesa</span><strong>${params.tableName}</strong></div>
  <div class="row"><span>Zona</span><strong>${params.zone}</strong></div>
  <div class="row"><span>Camarero</span><strong>${params.waiterName}</strong></div>
  ${params.cliente ? `<div class="row"><span>Cliente</span><strong>${params.cliente}</strong></div>` : ''}
  <div class="row"><span>Comensales</span><strong>${params.comensales}</strong></div>
  <hr>
  <div class="items">${params.nota.replace(/\n/g, '<br>')}</div>
  <hr>
  <div class="total">${params.total.toFixed(2)}€</div>
  <hr>
  <div class="qr">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}" alt="QR Ticket" crossorigin="anonymous">
    <div class="qr-label">Escanea para guardar el ticket</div>
  </div>
  <div class="footer">Gracias por su visita</div>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }
}
