import {API, fetchJSON, el, Auth, toast} from './common.js';

/* === Imagen acorde al vuelo (por ciudad y/o IATA) === */
function imageForFlight(f){
  const text = [
    (f.destination||f.destino||''),
    (f.origin||f.origen||''),
    (f.flight_number||'')
  ].join(' ').toLowerCase();

  const picks = [
    // --- Destinos Nacionales (México) ---
    {k:['cancún','cancun','cun'], url:'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1600&auto=format&fit=crop'},
    {k:['ciudad de méxico','ciudad de mexico','mexico city','mex','cdmx'], url:'https://images.unsplash.com/photo-1574340802131-5b91262b355b?q=80&w=1600&auto=format&fit=crop'},
    {k:['puebla','pbc'], url:'https://images.unsplash.com/photo-1582110159423-f1c74147c4df?q=80&w=1600&auto=format&fit=crop'},
    {k:['tijuana','tij'], url:'https://images.unsplash.com/photo-1581410606322-48a5c3917804?q=80&w=1600&auto=format&fit=crop'},
    {k:['guadalajara','gdl'], url:'https://images.unsplash.com/photo-1599837583762-c1b7e28b17b2?q=80&w=1600&auto=format&fit=crop'},
    {k:['querétaro','queretaro','qro'], url:'https://images.unsplash.com/photo-1582125712818-f03e1e9987a2?q=80&w=1600&auto=format&fit=crop'},
    {k:['monterrey','mty'], url:'https://images.unsplash.com/photo-1578932750561-4b9111d8db1f?q=80&w=1600&auto=format&fit=crop'},
    {k:['mérida','merida','mid'], url:'https://images.unsplash.com/photo-1620021632212-054b834e3223?q=80&w=1600&auto=format&fit=crop'},
    
    // --- Destinos Internacionales ---
    {k:['los ángeles','los angeles','lax'], url:'https://images.unsplash.com/photo-1503891450247-ee5f8ec46dc3?q=80&w=1600&auto=format&fit=crop'},
    {k:['parís','paris','cdg'], url:'https://images.unsplash.com/photo-1502602898657-3e91760c0337?q=80&w=1600&auto=format&fit=crop'},
    {k:['dubái','dubai','dxb'], url:'https://images.unsplash.com/photo-1512453979791-692591a07c3c?q=80&w=1600&auto=format&fit=crop'},
    {k:['doha','doh','qatar'], url:'https://images.unsplash.com/photo-1568503446066-f08250075344?q=80&w=1600&auto=format&fit=crop'},
    {k:['tokio','tokyo','nrt','hnd'], url:'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1600&auto=format&fit=crop'},
    {k:['londres','london','lhr','lgw'], url:'https://images.unsplash.com/photo-1505761671935-60b3a742750f?q=80&w=1600&auto=format&fit=crop'},
    {k:['madrid','mad'], url:'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1600&auto=format&fit=crop'},
    {k:['nueva york','new york','nyc','jfk'], url:'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=1600&auto=format&fit=crop'}
  ];
  for(const p of picks){ if(p.k.some(k=>text.includes(k))) return p.url; }
  // Imagen por defecto si no se encuentra ninguna coincidencia
  return 'https://images.unsplash.com/photo-1517400508447-f8a61523e34b?q=80&w=1600&auto=format&fit=crop';
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
  const passConfirmBox = document.getElementById('passConfirmBox');

  function applyMode(){
    const signup = (kind==='signup');
    title.textContent = signup ? 'Crear cuenta' : 'Iniciar sesión';
    nameBox.style.display = signup ? 'block' : 'none';
    passConfirmBox.style.display = signup ? 'block' : 'none';
    switchLink.innerHTML = signup ? '¿Ya tienes cuenta? <a href="#">Inicia sesión</a>' : '¿No tienes cuenta? <a href="#">Crear una</a>';
  }
  
  applyMode();
  dlg.showModal();

  form.onsubmit = async (e)=>{
    e.preventDefault();
    try{
      if(kind==='signup'){
        const pass1 = pass.value;
        const pass2 = document.getElementById('authPass2').value;
        const rules=/^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if(pass1 !== pass2){ alert('Las contraseñas no coinciden.'); return;}
        if(!rules.test(pass1)){ alert('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.'); return;}
        await Auth.signup(nameInput.value.trim(), email.value.trim(), pass1);
        toast('Cuenta registrada con éxito');
      }else{
        await Auth.login(email.value.trim(), pass.value);
        toast('Sesión iniciada');
      }
      dlg.close();
      await refreshAuthUI();
      bindLogoutOnce();
    }catch(err){ alert(err.message); }
  };

  switchLink.querySelector('a').onclick = (e)=>{ e.preventDefault(); kind = (kind==='signup'?'login':'signup'); applyMode(); };
  form.querySelector('button[value="cancel"]')?.addEventListener('click', ()=> dlg.close(), {once:true});
  dlg.addEventListener('close', () => form.reset());
}

function bindLogoutOnce(){
  const o = document.getElementById('navLogout');
  if(!o || o.dataset.bound) return;
  o.dataset.bound = '1';
  o.addEventListener('click', async (e)=>{
    e.preventDefault();
    await Auth.logout();
    await refreshAuthUI();
    toast('Sesión cerrada');
  });
}

/* === FLIGHTS === */
async function loadFlights(q=''){
  const url = q ? `${API}/search_flights.php?q=${encodeURIComponent(q)}` : `${API}/get_flights.php`;
  try {
    const data = await fetchJSON(url);
    const flights = data.flights || [];
    const list = document.getElementById('flights');
    list.innerHTML = '';
    if(flights.length===0){
      list.innerHTML = `<p class="text-gray-500 col-span-full text-center">No se encontraron vuelos que coincidan con la búsqueda.</p>`;
      return;
    }
    
    flights.forEach(f=>{
      const dest = f.destination || f.destino || '';
      const origin = f.origin || f.origen || '';
      const img = imageForFlight(f);
      const when = [f.date||f.fecha, f.time||f.hora].filter(Boolean).join(' &middot; ');
      const terminal = f.terminal ? `Terminal ${f.terminal}` : '';
      const gate = f.gate ? `Puerta ${f.gate}` : '';
      const meta = [when, terminal, gate].filter(Boolean).join(' &middot; ');

      const card = el(`
        <article class="neumorphic-panel rounded-2xl overflow-hidden shadow-lg reveal flex flex-col">
          <div class="relative h-48">
            <img src="${img}" alt="Destino: ${dest}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div class="absolute bottom-0 left-0 p-4">
                <h3 class="text-xl font-bold text-white">${dest}</h3>
                <p class="text-sm text-white opacity-90">${origin}</p>
            </div>
          </div>
          <div class="p-5 flex-grow flex flex-col justify-between">
            <div>
              <p class="font-semibold text-gray-800">${f.flight_number}</p>
              <p class="text-sm text-gray-600 mt-1">${meta}</p>
            </div>
            <div class="mt-4">
              <a class="block w-full text-center bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                 href="flight.html?code=${encodeURIComponent(f.flight_number)}">Ver detalles y asientos</a>
            </div>
          </div>
        </article>
      `);
      list.appendChild(card);
    });

  } catch (error) {
    document.getElementById('flights').innerHTML = `<p class="text-red-500 col-span-full text-center">Error al cargar los vuelos. Por favor, intenta de nuevo más tarde.</p>`;
    console.error("Error en loadFlights:", error);
  }
}

/* === ANIMATIONS === */
function setupScrollAnimations() {
  const revealElements = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => revealObserver.observe(el));
}


/* === Events === */
document.getElementById('btnSearch')?.addEventListener('click', ()=> loadFlights(document.getElementById('q').value.trim()));
document.getElementById('btnClear')?.addEventListener('click', ()=>{ document.getElementById('q').value=''; loadFlights(); });
document.getElementById('q')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadFlights(document.getElementById('q').value.trim());
    }
});


document.getElementById('navLogin')?.addEventListener('click', (e)=>{ e.preventDefault(); openAuth('login'); });
document.getElementById('navSignup')?.addEventListener('click', (e)=>{ e.preventDefault(); openAuth('signup'); });

/* === Init === */
(async ()=>{
  try{ const me = await Auth.me(); if(me){ /*toast('Sesión activa: '+me.email);*/ } }catch(_){}
  await refreshAuthUI();
  bindLogoutOnce();
  await loadFlights();
  setupScrollAnimations();
})();

