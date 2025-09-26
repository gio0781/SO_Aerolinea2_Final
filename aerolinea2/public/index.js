
import {API, fetchJSON, el, Auth, toast} from './common.js';

/* === Imagen acorde al vuelo (por ciudad y/o IATA) === */
function imageForFlight(f){
  const text = [
    (f.destination||f.destino||''),
    (f.origin||f.origen||''),
    (f.flight_number||'')
  ].join(' ').toLowerCase();

  const picks = [
    // MX
    {k:['cancún','cancun','cun'], url:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1600&auto=format&fit=crop'},
    {k:['ciudad de méxico','ciudad de mexico','mexico city','mex','cdmx'], url:'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?q=80&w=1600&auto=format&fit=crop'},
    {k:['puebla','pbc'], url:'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1600&auto=format&fit=crop'},
    {k:['tijuana','tij'], url:'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=1600&auto=format&fit=crop'},
    {k:['guadalajara','gdl'], url:'https://images.unsplash.com/photo-1476850888966-1d0d8df5d0f6?q=80&w=1600&auto=format&fit=crop'},
    {k:['querétaro','queretaro','qro'], url:'https://images.unsplash.com/photo-1451976426598-a7593bd6d0b2?q=80&w=1600&auto=format&fit=crop'},
    {k:['monterrey','mty'], url:'https://images.unsplash.com/photo-1578932750561-4b9111d8db1f?q=80&w=1600&auto=format&fit=crop'},
    {k:['mérida','merida','mid'], url:'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1600&auto=format&fit=crop'},
    // Internacional
    {k:['los angeles','lax'], url:'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=1600&auto=format&fit=crop'},
    {k:['parís','paris','cdg','ory'], url:'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1600&auto=format&fit=crop'},
    {k:['dubái','dubai','dxb'], url:'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?q=80&w=1600&auto=format&fit=crop'},
    {k:['doha','doh','qatar'], url:'https://images.unsplash.com/photo-1517879288527-682ff596b235?q=80&w=1600&auto=format&fit=crop'},
    {k:['tokyo','tokio','nrt','hnd'], url:'https://images.unsplash.com/photo-1526481280698-8fcc13fd62af?q=80&w=1600&auto=format&fit=crop'},
    {k:['london','londres','lhr','lgw'], url:'https://images.unsplash.com/photo-1528901166007-3784c7dd3653?q=80&w=1600&auto=format&fit=crop'},
    {k:['madrid','mad'], url:'https://images.unsplash.com/photo-1493397212122-2b85dda8106b?q=80&w=1600&auto=format&fit=crop'},
    {k:['new york','nyc','jfk','lga','ewr'], url:'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1600&auto=format&fit=crop'}
  ];
  for(const p of picks){ if(p.k.some(k=>text.includes(k))) return p.url; }
  return 'https://images.unsplash.com/photo-1490100667990-4fced8021649?q=80&w=1600&auto=format&fit=crop';
}

/* === AUTH UI === */
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

function openAuth(kind='login'){
  const dlg = document.getElementById('authModal');
  const form = document.getElementById('authForm');
  const title = document.getElementById('authTitle');
  const email = document.getElementById('authEmail');
  const pass = document.getElementById('authPass');
  const nameBox = document.getElementById('nameBox');
  const nameInput = document.getElementById('authName');
  const switchLink = document.getElementById('switchToSignup');

  function applyMode(){
    const signup = (kind==='signup');
    title.textContent = signup ? 'Crear cuenta' : 'Iniciar sesión';
    nameBox.style.display = signup ? '' : 'none';
    switchLink.textContent = signup ? 'Iniciar sesión' : 'Crear una';
  }
  applyMode();
  dlg.showModal();
  form.onsubmit = async (e)=>{
    e.preventDefault();
    try{
      if(kind==='signup'){
        await Auth.signup(nameInput.value.trim(), email.value.trim(), pass.value);
        toast('Cuenta registrada');
      }else{
        await Auth.login(email.value.trim(), pass.value);
        toast('Sesión iniciada');
      }
      dlg.close();
      await refreshAuthUI();
      bindLogoutOnce();
    }catch(err){ alert(err.message); }
  };
  switchLink.onclick = (e)=>{ e.preventDefault(); kind = (kind==='signup'?'login':'signup'); applyMode(); };
  // Botón cancelar en <menu>
  form.querySelector('button[value="cancel"]')?.addEventListener('click', ()=> dlg.close(), {once:true});
}

function bindLogoutOnce(){
  const o = document.getElementById('navLogout');
  if(!o || o.dataset.bound) return;
  o.dataset.bound = '1';
  o.addEventListener('click', async (e)=>{
    e.preventDefault();
    await Auth.logout();
    await refreshAuthUI();
    alert('Sesión cerrada');
  });
}

/* === FLIGHTS === */
async function loadFlights(q=''){
  const url = q ? `${API}/search_flights.php?q=${encodeURIComponent(q)}` : `${API}/get_flights.php`;
  const data = await fetchJSON(url);
  const flights = data.flights || [];
  const list = document.getElementById('flights');
  list.innerHTML = '';
  if(flights.length===0){
    list.appendChild(el(`<p class="text-gray-500">No hay vuelos que coincidan.</p>`));
    return;
  }
  const grid = el(`<div class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>`);
  flights.forEach(f=>{
    const dest = f.destination || f.destino || '';
    const origin = f.origin || f.origen || '';
    const img = imageForFlight(f);
    const when = [f.date||f.fecha, f.time||f.hora].filter(Boolean).join(' · ');
    const terminal = f.terminal ? `Terminal ${f.terminal}` : '';
    const gate = f.gate ? `Puerta ${f.gate}` : '';
    const meta = [when, terminal, gate].filter(Boolean).join(' · ');
    const card = el(`
      <article class="neumorphic-panel p-4 reveal">
        <img src="${img}" alt="${dest||'Destino'}" class="w-full h-40 object-cover rounded-xl shadow-lg">
        <div class="mt-4">
          <h3 class="text-lg font-semibold">${f.flight_number || 'Vuelo'}</h3>
          <p class="text-sm text-gray-600">${origin} → ${dest}</p>
          <p class="text-sm mt-1">${meta}</p>
          <div class="mt-3 flex gap-2">
            <a class="neumorphic-button py-2 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg"
               href="flight.html?code=${encodeURIComponent(f.flight_number)}">Ver detalles</a>
          </div>
        </div>
      </article>
    `);
    grid.appendChild(card);
  });
  list.appendChild(grid);
}

/* === Events === */
document.getElementById('btnSearch')?.addEventListener('click', ()=> loadFlights(document.getElementById('q').value.trim()));
document.getElementById('btnClear')?.addEventListener('click', ()=>{ document.getElementById('q').value=''; loadFlights(); });

document.getElementById('navLogin')?.addEventListener('click', (e)=>{ e.preventDefault(); openAuth('login'); });
document.getElementById('navSignup')?.addEventListener('click', (e)=>{ e.preventDefault(); openAuth('signup'); });

/* === Init === */
(async ()=>{
  try{ const me = await Auth.me(); if(me){ toast('Sesión activa: '+me.email); } }catch(_){}
  await refreshAuthUI();
  bindLogoutOnce();
  loadFlights();
})();
