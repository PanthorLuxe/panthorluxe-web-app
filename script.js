/* INICIO DEL CÓDIGO COMPLETO DE script.js */
// =================================================================
// Menú móvil (Hamburguesa)
// =================================================================
const burger = document.querySelector('.hamburger');
const nav = document.getElementById('mainnav');
if (burger && nav){
  burger.addEventListener('click', ()=>{
    // Alterna la clase 'open' en el menú de navegación
    const open = nav.classList.toggle('open');
    // Actualiza el atributo aria-expanded para accesibilidad
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// =================================================================
// Funciones de Utilidad
// =================================================================

/**
 * Formatea un número como moneda en formato europeo (ej: 1200 -> "1.200").
 * @param {number} v El número a formatear.
 * @returns {string} El número formateado.
 */
function euro(v){ return Number(v).toLocaleString('es-ES'); }

/**
 * Crea un elemento del DOM a partir de un string HTML.
 * @param {string} html El string HTML.
 * @returns {Node} El primer nodo del elemento creado.
 */
function createEl(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

/**
 * Crea un contenedor de imagen con estados de carga y error.
 * @param {string} src La URL de la imagen.
 * @param {string} alt El texto alternativo para la imagen.
 * @returns {HTMLElement} Un div que contendrá la imagen o el mensaje de fallback.
 */
function withImgFallback(src, alt){
  const img = new Image();
  img.src = src; img.alt = alt || ''; img.loading = 'lazy';
  const wrap = document.createElement('div');
  // En caso de error de carga, muestra "Sin imagen"
  img.onerror = () => wrap.replaceChildren(createEl('<div class="img-fallback">Sin imagen</div>'));
  // Cuando carga, reemplaza el placeholder con la imagen real
  img.onload  = () => wrap.replaceChildren(img);
  // Muestra un mensaje de "Cargando..." por defecto
  wrap.appendChild(createEl('<div class="img-fallback">Cargando…</div>'));
  return wrap;
}

// =================================================================
// Lógica de la página de Alquileres (buscador + paginado)
// =================================================================
(async function(){
  // Si no estamos en la página de alquileres, no hacer nada
  const grid = document.getElementById('rentalsGrid');
  if (!grid) return;

  let data = [];
  try {
    // Carga los datos de los alquileres desde un archivo JSON
    const res = await fetch('data/alquileres.json');
    data = await res.json();
  } catch(error) {
    console.error('Error al cargar alquileres.json:', error);
    data = []; // Asegura que 'data' sea un array vacío en caso de error
  }

  const form = document.getElementById('searchForm');
  const pagination = document.getElementById('pagination');
  const PAGE_SIZE = 9;
  let page = 1, results = [...data]; // 'results' contiene los datos filtrados

  // Aplica los filtros del formulario y vuelve a renderizar
  function applyFilters(){
    const q = (form.q.value || '').toLowerCase().trim();
    const city = form.city.value || '';
    const status = form.status.value || '';
    const min = parseInt(form.min.value || '0', 10);
    const max = parseInt(form.max.value || '9999999', 10);
    // Filtra el array original 'data' basándose en los criterios
    results = data.filter(r => {
      const matchesQ = q ? (r.title.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)) : true;
      const matchesCity = city ? r.city === city : true;
      const matchesStatus = status ? r.status === status : true;
      const matchesPrice = r.price >= min && r.price <= max;
      return matchesQ && matchesCity && matchesStatus && matchesPrice;
    });
    page = 1; // Resetea a la primera página tras un filtro
    render();
  }

  // Dibuja los resultados y la paginación en la pantalla
  function render(){
    // Limpia el contenido previo
    grid.innerHTML = '';
    // Calcula qué porción de los resultados mostrar en la página actual
    const start = (page - 1) * PAGE_SIZE;
    const slice = results.slice(start, start + PAGE_SIZE);

    // Crea y añade una tarjeta por cada resultado
    slice.forEach(r => {
      const badgeClass = r.status==='disponible' ? 'ok' : (r.status==='proximo' ? 'soon' : 'off');
      const badgeText = r.status==='disponible' ? 'Disponible' : (r.status==='proximo' ? 'Próximo' : 'Alquilado');
      const card = createEl(`<article class="card rental"><div class="media"></div><div class="card__body">
          <h3>${r.title} – ${r.city}</h3>
          <p>${euro(r.price)} €/mes</p>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div></article>`);
      card.querySelector('.media').appendChild(withImgFallback(r.img, `${r.title} – ${r.city}`));
      grid.appendChild(card);
    });

    // Lógica para generar los botones de paginación
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

  // Asigna los eventos iniciales al formulario
  form.addEventListener('submit', e=>{ e.preventDefault(); applyFilters(); });
  form.addEventListener('change', applyFilters);

  // Primera renderización al cargar la página
  render();
})();

// =================================================================
// Lógica de la página de Proyectos (Tabs)
// =================================================================
(async function(){
  // Si no estamos en la página de proyectos, no hacer nada
  const t = document.querySelector('.tabs');
  if (!t) return;

  const btns = t.querySelectorAll('.tab');
  const listTerm = document.getElementById('proyectosTerminados');
  const listProc = document.getElementById('proyectosProceso');
  let data = { terminados: [], proceso: [] };
  try {
    const res = await fetch('data/proyectos.json');
    data = await res.json();
  } catch(error) {
    console.error('Error al cargar proyectos.json:', error);
  }

  // Función para renderizar una lista de proyectos en un contenedor
  function renderList(container, items){
    container.innerHTML = '';
    items.forEach(p => {
      const card = createEl(`<article class="card"><div class="media"></div><div class="card__body">
          <h3>${p.title}</h3>
          <p>${p.desc}</p>
        </div></article>`);
      card.querySelector('.media').appendChild(withImgFallback(p.img, p.title));
      container.appendChild(card);
    });
  }
  renderList(listTerm, data.terminados);
  renderList(listProc, data.proceso);

  // Lógica para el cambio de pestañas (tabs)
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
  // Si no estamos en la página de galería, no hacer nada
  const grid = document.getElementById('galeriaGrid');
  if (!grid) return;

  const imgs = []; // Añade rutas locales cuando metas fotos: ["img/foto1.jpg", ...]

  if (imgs.length === 0) {
    // Muestra un mensaje si no hay imágenes que cargar
    grid.appendChild(createEl('<p>No hay imágenes cargadas aún. Sube tus fotos a <code>/img/</code>.</p>'));
    return;
  }
  imgs.forEach(src => {
    const card = createEl('<article class="card"><div class="media"></div></article>');
    card.querySelector('.media').appendChild(withImgFallback(src, 'Imagen de galería'));
    grid.appendChild(card);
  });
})();

// =================================================================
// Lógica del Formulario de Contacto → Azure Functions
// =================================================================
(function(){
  // Si no hay formulario de contacto en la página, no hacer nada
  const form = document.getElementById('contactForm');
  const msg  = document.getElementById('formMsg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Enviando...';
    const data = Object.fromEntries(new FormData(form));

    // Validación básica del lado del cliente
    if (!data.nombre || !data.email || !form.querySelector('[name="acepto"]').checked) {
      msg.textContent = 'Revisa los campos requeridos y la política de privacidad.';
      return;
    }

    try {
      // Envía los datos a la API de Azure Functions
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();

      // Muestra el mensaje de éxito o error al usuario
      if (json.ok) {
        form.reset();
        msg.textContent = '¡Gracias! Hemos recibido tu solicitud.';
      } else {
        msg.textContent = 'No se pudo enviar. Intenta de nuevo más tarde.';
      }
    } catch(error) {
      console.error('Error al enviar el formulario:', error);
      msg.textContent = 'Error de conexión. Intenta de nuevo.';
    }
  });
})();
/* FIN DEL CÓDIGO COMPLETO DE script.js */