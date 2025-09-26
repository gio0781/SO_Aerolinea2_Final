async function refreshAuthUI(){
  try{
    const me = await Auth.me();
    const login=document.getElementById('navLogin');
    const signup=document.getElementById('navSignup');
    const mis=document.getElementById('navMisVuelos');
    const logout=document.getElementById('navLogout');
    if(login) login.style.display = me? 'none' : '';
    if(signup) signup.style.display = me? 'none' : '';
    if(mis) mis.style.display = me? '' : 'none';
    if(logout) logout.style.display = me? '' : 'none';
  }catch(e){}
}
import {API, fetchJSON, el, PRICES, token, Auth, toast} from './common.js';

const params = new URLSearchParams(location.search);
const flight_code = params.get('code');
const state = { flight:null, seats:[], selected:new Map(), extras:{bag25:0, bagExtra:0} };

function renderDetail(){
  const f = state.flight;
  document.getElementById('title').textContent = `Vuelo ${f.flight_number}`;
  document.getElementById('detail').innerHTML = `<div class="card neo">
    <h2>${f.origin} → ${f.destination}</h2>
    <div class="meta"><strong>${f.date}</strong> • ${f.time} • ${f.terminal} / ${f.gate} • ${f.type}</div>
  </div>`;
}
function seatTile(s){ const div = el(`<div class="seat ${s.status} ${s.class}" data-code="${s.seat_code}">${s.seat_code}</div>`); div.onclick=()=>seatClick(s); return div; }
function renderSeats(){
  const first=document.getElementById('gridFirst'), eco=document.getElementById('gridEco'); first.innerHTML=''; eco.innerHTML='';
  state.seats.forEach(s=> (s.class==='first'?first:eco).appendChild(seatTile(s))); updateCart();
}
function makeChip(label,active){ const c = el(`<span class="chip${active?' active':''}">${label}</span>`); return c; }
function updateCart(){
  const c = document.getElementById('cart'); c.innerHTML='';
  let total=0;
  for(const [code,cat] of state.selected.entries()){
    const s = state.seats.find(x=>x.seat_code===code);
    const price = (s.class==='first')? PRICES.primera : PRICES[cat];
    total += price;
    const row = el(`<div class="cart-item" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #d4e6ff">
      <div><strong>${code}</strong> — ${(s.class==='first')?'Primera':'Turista'} ${s.class==='economy' ? '<div class="cat-chips"></div>' : ''}</div>
      <div>$${price.toLocaleString('es-MX')}</div></div>`);
    if(s.class==='economy'){
      const host = row.querySelector('.cat-chips');
      ['adulto','nino','tercera'].forEach(k=>{ const chip=makeChip(k,k===cat); chip.onclick=()=>{ state.selected.set(code,k); updateCart(); }; host.appendChild(chip); });
    }
    c.appendChild(row);
  }
  const extrasBox = el(`<div style="margin-top:8px">
    <h4>Equipaje</h4>
    <div class="cat-chips">
      <span class="chip">Documentado 25kg ($800) x <input id="exBag25" type="number" min="0" max="5" value="${state.extras.bag25}" style="width:60px; padding:6px 8px; border-radius:10px; border:1px solid #d4e6ff"></span>
      <span class="chip">Maleta adicional ($1200) x <input id="exBagExtra" type="number" min="0" max="5" value="${state.extras.bagExtra}" style="width:60px; padding:6px 8px; border-radius:10px; border:1px solid #d4e6ff"></span>
    </div>
  </div>`);
  extrasBox.querySelector('#exBag25').onchange = (e)=>{ state.extras.bag25 = parseInt(e.target.value||'0',10); };
  extrasBox.querySelector('#exBagExtra').onchange = (e)=>{ state.extras.bagExtra = parseInt(e.target.value||'0',10); };
  c.appendChild(extrasBox);
  const extrasTotal = state.extras.bag25*800 + state.extras.bagExtra*1200;
  const seatsTotal = total; const grand = seatsTotal + extrasTotal;
  c.appendChild(el(`<div class="meta" style="margin-top:8px"><strong>Asientos:</strong> ${state.selected.size} <span style="float:right"><strong>Subtotal asientos:</strong> $${seatsTotal.toLocaleString('es-MX')}</span></div>`));
  c.appendChild(el(`<div class="meta"><strong>Extras:</strong> $${extrasTotal.toLocaleString('es-MX')}</div>`));
  c.appendChild(el(`<div class="meta"><strong>Total:</strong> $${grand.toLocaleString('es-MX')}</div>`));
}
async function seatClick(seat){
  const ticketCount = parseInt(document.getElementById('ticketCount').value||'1',10);
  if (!state.selected.has(seat.seat_code) && state.selected.size >= ticketCount){ alert('Ya alcanzaste el número de boletos indicado.'); return; }
  if (seat.status==='purchased') return;
  try{
    if (state.selected.has(seat.seat_code)){
      await fetchJSON(`${API}/release_seat.php`, {method:'POST', body: JSON.stringify({flight_code, seat_code:seat.seat_code, token})});
      state.selected.delete(seat.seat_code);
    } else {
      await fetchJSON(`${API}/hold_seat.php`, {method:'POST', body: JSON.stringify({flight_code, seat_code:seat.seat_code, token})});
      const cat = (seat.class==='economy') ? 'adulto' : 'primera';
      state.selected.set(seat.seat_code, cat);
    }
    await refreshSeats();
  }catch(err){ alert(err.message); }
}
async function refreshSeats(){ const res = await fetchJSON(`${API}/get_seats.php?code=${encodeURIComponent(flight_code)}`); state.seats=res.seats; renderSeats(); }
function setAuthSwitch(kind){
  const box=document.getElementById('authSwitch');
  if(!box) return;
  box.innerHTML = (kind==='signup') ? '¿Ya tienes cuenta? <a href="#" id="switchToLogin">Inicia sesión</a>' : '¿No tienes cuenta? <a href="#" id="switchToSignup">Crear una</a>';
}

function openAuth(kind){
  const dlg = document.getElementById('authModal'); const title=document.getElementById('authTitle'); const nameBox=document.getElementById('nameBox');
  title.textContent = (kind==='signup')? 'Crear cuenta' : 'Iniciar sesión';
  setAuthSwitch(kind); nameBox.style.display = (kind==='signup')? '' : 'none';
  let confirm = document.getElementById('authPass2'); if(!confirm){ const wrap=document.createElement('label'); wrap.innerHTML='Confirmar contraseña <input type="password" id="authPass2" minlength="6">'; document.getElementById('authForm').insertBefore(wrap, document.getElementById('authForm').querySelector('menu')); wrap.style.display=(kind==='signup')?'':'none'; }
  document.getElementById('authPass2').parentElement.style.display = (kind==='signup')? '' : 'none';
  dlg.showModal();
  document.getElementById('authSubmit').onclick = async (e)=>{
    e.preventDefault(); const email=document.getElementById('authEmail').value.trim(); const pass=document.getElementById('authPass').value;
    try{
      if(kind==='signup'){ const name=document.getElementById('authName').value.trim(); const pass2=document.getElementById('authPass2').value; const rules=/^(?=.*[A-Z])(?=.*\d).{8,}$/; if(pass!==pass2){ alert('Las contraseñas no coinciden.'); return;} if(!rules.test(pass)){ alert('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.'); return;} await Auth.signup(name,email,pass); toast('Cuenta registrada'); }
      else { await Auth.login(email,pass); toast('Sesión iniciada'); }
      dlg.close(); if (typeof refreshAuthUI==='function') { refreshAuthUI(); bindLogoutOnce(); }
    }catch(err){ alert(err.message); }
  };
  document.getElementById('switchToSignup').onclick = (e)=>{ e.preventDefault(); dlg.close(); if (typeof refreshAuthUI==='function') { refreshAuthUI(); bindLogoutOnce(); } openAuth(kind==='signup' ? 'login':'signup'); };
  dlg.addEventListener('cancel', ()=> dlg.close(), {once:true});
}
function ensurePaymentIfNeeded(method){
  if (method!=='tarjeta') return Promise.resolve(true);
  const dlg=document.getElementById('payModal'); dlg.showModal();
  return new Promise((resolve)=>{
    document.getElementById('paySubmit').onclick = (e)=>{
      e.preventDefault();
      const name = document.getElementById('cardName').value.trim();
      const num = document.getElementById('cardNumber').value.trim();
      const exp = document.getElementById('cardExp').value.trim();
      const cvv = document.getElementById('cardCVV').value.trim();
      if(!name || num.length<12 || cvv.length<3){ alert('Completa los datos de tarjeta.'); return; }
      dlg.close(); if (typeof refreshAuthUI==='function') { refreshAuthUI(); bindLogoutOnce(); } resolve(true);
    };
    dlg.addEventListener('cancel', ()=> { dlg.close(); if (typeof refreshAuthUI==='function') { refreshAuthUI(); bindLogoutOnce(); } resolve(false); }, {once:true});
  });
}
document.getElementById('btnClear').onclick = async ()=>{
  for (const code of Array.from(state.selected.keys())){ try{ await fetchJSON(`${API}/release_seat.php`, {method:'POST', body: JSON.stringify({flight_code, seat_code:code, token})}); }catch{} state.selected.delete(code); }
  await refreshSeats();
};
document.getElementById('btnCheckout').onclick = async ()=>{
  if (!Auth.user){ openAuth('login'); return; }
  if (state.selected.size===0){ alert('No hay asientos seleccionados.'); return; }
  const method = document.getElementById('paymentMethod').value;
  if (!await ensurePaymentIfNeeded(method)) return;
  const seat_codes = Array.from(state.selected.keys());
  const categories = Object.fromEntries(state.selected.entries());
  try{
    const res = await fetchJSON(`${API}/checkout.php`, {method:'POST', body: JSON.stringify({flight_code, seat_codes, categories, token, payment_method:method, extras: state.extras})});
    const r = res.receipt; const dlg = document.getElementById('receiptModal');
    document.getElementById('receipt').innerHTML = `
      <h3>Pago realizado</h3>
      <p><strong>Código de reservación:</strong> ${r.reservation_code}</p>
      <p><strong>Vuelo:</strong> ${r.flight_number}</p>
      <p><strong>Ruta:</strong> ${r.origin} → ${r.destination}</p>
      <p><strong>Fecha/Hora:</strong> ${r.date} ${r.time}</p>
      <p><strong>Terminal/Puerta:</strong> ${r.terminal} / ${r.gate}</p>
      <p><strong>Asientos:</strong> ${r.seat_codes.join(', ')}</p>
      <p><strong>Extras:</strong> $${r.extras_total.toLocaleString('es-MX')}</p>
      <p style="font-size:1.15em"><strong>Total:</strong> $${r.total.toLocaleString('es-MX')}</p>`;
    dlg.showModal(); toast('Pago realizado'); state.selected.clear(); await refreshSeats();
  }catch(err){ alert(err.message); }
};
async function init(){ await Auth.me(); const fr=await fetchJSON(`${API}/get_flight.php?code=${encodeURIComponent(flight_code)}`); state.flight=fr.flight; renderDetail(); await refreshSeats(); setInterval(refreshSeats, 5000); }
refreshAuthUI();
bindLogoutOnce();
init();

(function dialogCancelCloser(){ document.querySelectorAll('dialog .btn[value="cancel"]').forEach(btn=>{ btn.addEventListener('click', ()=>{ const d=btn.closest('dialog'); if(d) d.close(); }); }); })();

function bindLogoutOnce(){ const o=document.getElementById('navLogout'); if(!o) return; if(o._bound) return; o._bound=true; o.onclick=async(e)=>{ e.preventDefault(); await Auth.logout(); await refreshAuthUI(); alert('Sesión cerrada'); }; }
