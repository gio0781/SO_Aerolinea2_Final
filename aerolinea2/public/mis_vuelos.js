import {API, fetchJSON, el, Auth} from './common.js';
async function init(){
  const me = await Auth.me(); const root=document.getElementById('list');
  if(!me){ root.innerHTML='<p>Inicia sesión para ver tus vuelos.</p>'; return; }
  const res = await fetchJSON(`${API}/my_purchases.php`);
  if(res.purchases.length===0){ root.innerHTML='<p>No tienes compras registradas.</p>'; return; }
  res.purchases.forEach(p=>{
    const card = el(`<div class="card neo" style="margin:10px 0">
      <h3>${p.flight_number} — ${p.origin} → ${p.destination}</h3>
      <div class="meta">${p.date} ${p.time} • ${p.terminal} / ${p.gate}</div>
      <div class="meta">Reserva: <strong>${p.reservation_code||'-'}</strong></div>
      <div class="meta">Pago: ${p.payment_method.toUpperCase()} • Total: $${(p.total_amount + p.extras_amount).toLocaleString('es-MX')}</div>
      <div class="meta">Asientos: ${p.items.map(i=>i.seat_code).join(', ')}</div>
      <div class="meta">Extras: ${p.extras.length? p.extras.map(e=> e.label+' x'+e.qty+' ($'+e.subtotal.toLocaleString('es-MX')+')').join(' • ') : '—'}</div>
    </div>`);
    root.appendChild(card);
  });
}
init();
