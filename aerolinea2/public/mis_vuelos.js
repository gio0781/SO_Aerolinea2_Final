import {API, fetchJSON, el, Auth} from './common.js';

async function init(){
  const me = await Auth.me(); 
  const root = document.getElementById('list');

  if(!me){ 
    root.innerHTML=`
      <div class="neumorphic-panel text-center p-12">
        <h3 class="text-2xl font-bold text-gray-800">Acceso Requerido</h3>
        <p class="text-gray-600 mt-2">Por favor, inicia sesión para ver tu historial de vuelos.</p>
      </div>
    `; 
    return; 
  }

  const res = await fetchJSON(`${API}/my_purchases.php`);
  if(res.purchases.length === 0){ 
    root.innerHTML=`
      <div class="neumorphic-panel text-center p-12">
        <h3 class="text-2xl font-bold text-gray-800">Sin Vuelos Aún</h3>
        <p class="text-gray-600 mt-2">No tienes compras registradas en tu cuenta.</p>
      </div>
    `; 
    return; 
  }

  res.purchases.forEach(p => {
    const extrasList = p.extras.length 
      ? p.extras.map(e => `${e.label} x${e.qty} ($${e.subtotal.toLocaleString('es-MX')})`).join(' • ') 
      : 'Ninguno';

    const card = el(`
        <div class="neumorphic-panel p-6 mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">${p.flight_number}</h3>
                    <p class="text-lg text-gray-600">${p.origin} → ${p.destination}</p>
                </div>
                <div class="text-left md:text-right mt-2 md:mt-0">
                    <p class="font-semibold text-blue-600 text-lg">${p.reservation_code || '-'}</p>
                    <p class="text-sm text-gray-500">${p.date} ${p.time}</p>
                </div>
            </div>
            <div class="mt-4 border-t border-gray-300/50 pt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p><strong>Asientos:</strong> <span class="font-mono bg-gray-200/50 px-2 py-1 rounded-md text-sm">${p.items.map(i=>i.seat_code).join(', ')}</span></p>
                        <p class="mt-1"><strong>Detalles:</strong> ${p.terminal} / ${p.gate}</p>
                        <p class="mt-1"><strong>Extras:</strong> ${extrasList}</p>
                    </div>
                    <div class="md:text-right">
                        <p class="text-gray-600">Pagado con ${p.payment_method}</p>
                        <p class="text-2xl font-bold text-gray-800 mt-1">$${(p.total_amount + p.extras_amount).toLocaleString('es-MX')}</p>
                    </div>
                </div>
            </div>
        </div>
    `);
    root.appendChild(card);
  });
}
init();
