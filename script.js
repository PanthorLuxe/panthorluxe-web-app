// =================================================================
// Menú móvil (Hamburguesa)
// =================================================================
const burger = document.querySelector('.hamburger');
const nav = document.getElementById('mainnav');

if (burger && nav) {
  burger.addEventListener('click', () => {
    // Usamos el contenedor del menú que creamos en el HTML
    const menuContainer = burger.closest('.header__menu-container');
    const isOpen = menuContainer.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', isOpen);
  });
}

// =================================================================
// Funciones de Utilidad
// =================================================================
function euro(v){ return Number(v).toLocaleString('es-ES'); }
function createEl(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function withImgFallback(src, alt){
  const img = new Image();
  img.src = src; img.alt = alt || ''; img.loading = 'lazy';
  const wrap = document.createElement('div');
  img.onerror = () => wrap.replaceChildren(createEl('<div class="img-fallback">Sin imagen</div>'));
  img.onload  = () => wrap.replaceChildren(img);
  wrap.appendChild(createEl('<div class="img-fallback">Cargando…</div>'));
  return wrap;
}

// =================================================================
// Lógica de la página de Alquileres
// =================================================================
(async function(){
  const grid = document.getElementById('rentalsGrid');
  if (!grid) return;
  let data = [];
  try { const res = await fetch('data/alquileres.json'); data = await res.json(); } catch(e) { console.error(e); data = []; }
  const form = document.getElementById('searchForm');
  const pagination = document.getElementById('pagination');
  const PAGE_SIZE = 9;
  let page = 1, results = [...data];
  function applyFilters(){
    const q = (form.q.value || '').toLowerCase().trim();
    const city = form.city.value || '';
    const status = form.status.value || '';
    const min = parseInt(form.min.value || '0', 10);
    const max = parseInt(form.max.value || '9999999', 10);
    results = data.filter(r => {
      const matchesQ = q ? (r.title.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)) : true;
      const matchesCity = city ? r.city === city : true;
      const matchesStatus = status ? r.status === status : true;
      const matchesPrice = r.price >= min && r.price <= max;
      return matchesQ && matchesCity && matchesStatus && matchesPrice;
    });
    page = 1; render();
  }
  function render(){
    grid.innerHTML = '';
    const start = (page-1)*PAGE_SIZE;
    const slice = results.slice(start, start+PAGE_SIZE);
    slice.forEach(r => {
      const badgeClass = r.status==='disponible' ? 'ok' : (r.status==='proximo' ? 'soon' : 'off');
      const badgeText = r.status==='disponible' ? 'Disponible' : (r.status==='proximo' ? 'Próximo' : 'Alquilado');
      const card = createEl(`<article class="card rental"><div class="media"></div><div class="card__body"><h3>${r.title} – ${r.city}</h3><p>${euro(r.price)} €/mes</p><span class="badge ${badgeClass}">${badgeText}</span></div></article>`);
      card.querySelector('.media').appendChild(withImgFallback(r.img, `${r.title} – ${r.city}`));
      grid.appendChild(card);
    });
    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    pagination.innerHTML = '';
    const prev = createEl(`<button class="chip"${page===1?' disabled':''}>« Anterior</button>`);
    prev.addEventListener('click', ()=>{ if(page>1){ page--; render(); }});
    pagination.appendChild(prev);
    for(let p=1;p<=totalPages;p++){
      const b = createEl(`<button class="chip${p===page?' is-active':''}">${p}</button>`);
      b.addEventListener('click', ()=>{ page = p; render(); });
      pagination.appendChild(b);
    }
    const next = createEl(`<button class="chip"${page===totalPages?' disabled':''}>Siguiente »</button>`);
    next.addEventListener('click', ()=>{ if(page<totalPages){ page++; render(); }});
    pagination.appendChild(next);
  }
  form.addEventListener('submit', e=>{ e.preventDefault(); applyFilters(); });
  form.addEventListener('change', applyFilters);
  render();
})();

// =================================================================
// Lógica de la página de Proyectos
// =================================================================
(async function(){
  const t = document.querySelector('.tabs');
  if (!t) return;
  const btns = t.querySelectorAll('.tab');
  const listTerm = document.getElementById('proyectosTerminados');
  const listProc = document.getElementById('proyectosProceso');
  let data = { terminados: [], proceso: [] };
  try { const res = await fetch('data/proyectos.json'); data = await res.json(); } catch(e) { console.error(e) }
  function renderList(container, items){
    container.innerHTML = '';
    items.forEach(p => {
      const card = createEl(`<article class="card"><div class="media"></div><div class="card__body"><h3>${p.title}</h3><p>${p.desc}</p></div></article>`);
      card.querySelector('.media').appendChild(withImgFallback(p.img, p.title));
      container.appendChild(card);
    });
  }
  renderList(listTerm, data.terminados);
  renderList(listProc, data.proceso);
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    const tab = b.dataset.tab;
    document.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('is-hidden', p.dataset.panel !== tab));
  }));
})();

// =================================================================
// Lógica de la página de Galería
// =================================================================
(function(){
  const grid = document.getElementById('galeriaGrid');
  if (!grid) return;
  const imgs = [];
  if (imgs.length === 0) {
    grid.appendChild(createEl('<p>No hay imágenes cargadas aún.</p>'));
    return;
  }
  imgs.forEach(src => {
    const card = createEl('<article class="card"><div class="media"></div></article>');
    card.querySelector('.media').appendChild(withImgFallback(src, 'Imagen de galería'));
    grid.appendChild(card);
  });
})();

// =================================================================
// Lógica del Formulario de Contacto (con depuración)
// =================================================================
(function(){
  const form = document.getElementById('contactForm');
  const msg  = document.getElementById('formMsg');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Enviando...';
    const data = Object.fromEntries(new FormData(form));
    if (!data.nombre || !data.email || !form.querySelector('[name="acepto"]').checked) {
      msg.textContent = 'Revisa los campos requeridos y la política de privacidad.';
      return;
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.ok) {
        form.reset();
        msg.textContent = '¡Gracias! Hemos recibido tu solicitud.';
      } else {
        msg.textContent = 'No se pudo enviar. Intenta de nuevo más tarde.';
        console.error('Error detallado recibido del servidor:', json.debug_info);
      }
    } catch (error) {
      console.error('Error de conexión al enviar el formulario:', error);
      msg.textContent = 'Error de conexión. Intenta de nuevo.';
    }
  });
})();

// =================================================================
// Lógica del Hero Carousel (NUEVO)
// =================================================================
(function(){
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;
  
  const slides = carousel.querySelectorAll('.carousel-slide');
  let currentSlide = 0;
  
  if (slides.length > 0) {
    slides[currentSlide].classList.add('is-active');

    setInterval(() => {
      slides[currentSlide].classList.remove('is-active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('is-active');
    }, 5000);
  }
})();