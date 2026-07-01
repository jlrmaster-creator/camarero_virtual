export interface TicketGrupo {
  nombre: string;
  items: string;
  subtotal: number;
}

export function generateTicketHtml(params: {
  companyName?: string;
  tableName: string;
  zone: string;
  waiterName: string;
  cliente: string;
  comensales: number;
  nota?: string;
  grupos?: TicketGrupo[];
  total: number;
}): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES');
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const title = params.companyName || 'Camarero Virtual';

  const gruposHtml = params.grupos
    ? params.grupos.map(g => `
      <div class="grupo">
        <div class="grupo-title">${g.nombre}</div>
        <div class="items">${g.items.replace(/\n/g, '<br>')}</div>
        <div class="subtotal">Subtotal: ${g.subtotal.toFixed(2)}€</div>
      </div>`).join('<hr class="dashed">')
    : `<div class="items">${((params.nota) || '').replace(/\n/g, '<br>')}</div>`;

  let qrText = `Mesa: ${params.tableName} (${params.zone})\n` +
    `Fecha: ${dateStr} ${timeStr}\n` +
    `Camarero: ${params.waiterName}\n`;
  if (params.grupos) {
    params.grupos.forEach(g => {
      qrText += `\n--- ${g.nombre} ---\n`;
      qrText += g.items.replace(/<br>/g, '\n') + '\n';
      qrText += `Subtotal: ${g.subtotal.toFixed(2)}€\n`;
    });
  } else if (params.cliente) {
    qrText += `\nCliente: ${params.cliente}\n`;
  }
  qrText += `\nTOTAL: ${params.total.toFixed(2)}€`;
  const qrData = encodeURIComponent(qrText);

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0"><title>Ticket</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 18px; max-width: 500px; margin: 0 auto; padding: 24px 16px; background: #fff; color: #222; touch-action: pan-y pinch-zoom; }
  h2 { text-align: center; font-size: 28px; margin: 0 0 8px; }
  .header { text-align: center; font-size: 15px; color: #666; margin-bottom: 16px; }
  hr { border: none; border-top: 1px dashed #999; margin: 16px 0; }
  hr.dashed { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 18px; }
  .items { font-size: 17px; line-height: 1.7; padding: 6px 0; }
  .grupo { margin: 8px 0; }
  .grupo-title { font-size: 19px; font-weight: bold; margin-bottom: 4px; color: #2563eb; }
  .subtotal { font-size: 18px; font-weight: 600; text-align: right; margin-top: 6px; color: #444; }
  .total { font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; }
  .qr { text-align: center; margin-top: 28px; }
  .qr img { width: 180px; height: 180px; }
  .qr-label { font-size: 14px; color: #999; margin-top: 6px; }
  .footer { text-align: center; font-size: 15px; margin-top: 20px; color: #888; }
</style></head>
<body>
  <h2>${title}</h2>
  <div class="header">${dateStr} &middot; ${timeStr}</div>
  <hr>
  <div class="row"><span>Mesa</span><strong>${params.tableName}</strong></div>
  <div class="row"><span>Zona</span><strong>${params.zone}</strong></div>
  <div class="row"><span>Camarero</span><strong>${params.waiterName}</strong></div>
  ${params.cliente ? `<div class="row"><span>Cliente</span><strong>${params.cliente}</strong></div>` : ''}
  <div class="row"><span>Comensales</span><strong>${params.comensales}</strong></div>
  <hr>
  ${gruposHtml}
  <hr>
  <div class="total">${params.total.toFixed(2)}€</div>
  <hr>
  <div class="qr">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}" alt="QR Ticket" crossorigin="anonymous">
    <div class="qr-label">Escanea para guardar el ticket</div>
  </div>
  <div class="footer">Gracias por su visita</div>
</body></html>`;
}

export function printTicket(html: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url);
  if (win) {
    win.focus();
    setTimeout(() => win.print(), 800);
  }
}

export async function shareTicket(html: string, filename = 'ticket.html'): Promise<void> {
  if (!navigator.share) {
    printTicket(html);
    return;
  }
  const blob = new Blob([html], { type: 'text/html' });
  const file = new File([blob], filename, { type: 'text/html' });
  try {
    await navigator.share({
      title: 'Ticket',
      files: [file],
    });
  } catch {
    printTicket(html);
  }
}
