// =================================================================
// Menú móvil (Hamburguesa)
// =================================================================
const burger = document.querySelector('.hamburger');
if (burger) {
  burger.addEventListener('click', () => {
    const menuContainer = burger.closest('.header__menu-container');
    if (menuContainer) {
      const isOpen = menuContainer.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', isOpen);
    }
  });
}

// =================================================================
// Funciones de Utilidad
// =================================================================
function euro(v){ return Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function createEl(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function withImgFallback(src, alt){
  const img = new Image();
  img.src = src; img.alt = alt || ''; img.loading = 'lazy';
  const wrap = document.createElement('div');
  img.onerror = () => wrap.replaceChildren(createEl('<div class="img-fallback">Sin imagen</div>'));
  img.onload  = () => wrap.replaceChildren(img);
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
  try { const res = await fetch('/data/alquileres.json'); data = await res.json(); } catch(e) { console.error('Error cargando alquileres:', e); data = []; }
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
      const matchesQ = q ? (r.title.toLowerCase().includes(q) || (r.city && r.city.toLowerCase().includes(q))) : true;
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
      const badgeText = r.status.charAt(0).toUpperCase() + r.status.slice(1);
      const cardHTML = `<article class="card rental"><div class="media"></div><div class="card__body"><h3>${r.title}</h3><p>${euro(r.price)} /mes</p><span class="badge ${badgeClass}">${badgeText}</span></div></article>`;
      const cardLink = createEl(`<a href="detalle.html?id=${r.id}" class="card-link">${cardHTML}</a>`);
      cardLink.querySelector('.media').appendChild(withImgFallback(r.img, r.title));
      grid.appendChild(cardLink);
    });
    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    pagination.innerHTML = '';
    const prev = createEl(`<button class="chip"${page===1?' disabled':''}>« Anterior</button>`);
    prev.addEventListener('click', ()=>{ if(page>1){ page--; render(); window.scrollTo(0,0); }});
    pagination.appendChild(prev);
    for(let p=1;p<=totalPages;p++){
      const b = createEl(`<button class="chip${p===page?' is-active':''}">${p}</button>`);
      b.addEventListener('click', ()=>{ page = p; render(); window.scrollTo(0,0); });
      pagination.appendChild(b);
    }
    const next = createEl(`<button class="chip"${page===totalPages?' disabled':''}>Siguiente »</button>`);
    next.addEventListener('click', ()=>{ if(page<totalPages){ page++; render(); window.scrollTo(0,0); }});
    pagination.appendChild(next);
  }
  if (form) {
    form.addEventListener('submit', e=>{ e.preventDefault(); applyFilters(); });
    form.addEventListener('change', applyFilters);
  }
  render();
})();

// =================================================================
// Lógica de la página de Proyectos
// =================================================================
(async function(){
  const container = document.querySelector('.tabs');
  if (!container) return;
  const btns = container.querySelectorAll('.tab');
  const listTerm = document.getElementById('proyectosTerminados');
  const listProc = document.getElementById('proyectosProceso');
  let data = { terminados: [], proceso: [] };
  try { const res = await fetch('/data/proyectos.json'); data = await res.json(); } catch(e) { console.error('Error cargando proyectos.json:', e) }
  function renderList(grid, items){
    grid.innerHTML = '';
    items.forEach(p => {
      const cardHTML = `<article class="card"><div class="media"></div><div class="card__body"><h3>${p.title}</h3><p>${p.desc}</p></div></article>`;
      const cardLink = createEl(`<a href="detalle.html?id=${p.id}" class="card-link">${cardHTML}</a>`);
      cardLink.querySelector('.media').appendChild(withImgFallback(p.img, p.title));
      grid.appendChild(cardLink);
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
// Lógica de la página de Ventas
// =================================================================
(async function(){
  const grid = document.getElementById('salesGrid');
  if (!grid) return;
  let salesData = [];
  try { const res = await fetch('/data/ventas.json'); salesData = await res.json(); } catch(error) { console.error('Error al cargar ventas.json:', error); }
  function renderSales(){
    grid.innerHTML = '';
    salesData.forEach(p => {
      const cardHTML = `<article class="card"><div class="media"></div><div class="card__body"><h3>${p.title}</h3><p>${p.desc}</p><p style="font-weight: bold; font-size: 1.1em; color: var(--color-primary-dark);">${euro(p.price)}</p></div></article>`;
      const cardLink = createEl(`<a href="detalle.html?id=${p.id}" class="card-link">${cardHTML}</a>`);
      cardLink.querySelector('.media').appendChild(withImgFallback(p.img, p.title));
      grid.appendChild(cardLink);
    });
  }
  renderSales();
})();

// =================================================================
// Lógica de la página de Galería
// =================================================================
(async function(){
  const isGalleryPage = document.getElementById('galleryPage');
  if (!isGalleryPage) return;
  const mainImage = document.getElementById('galleryMainImage');
  const caption = document.getElementById('galleryCaption');
  const thumbnailsContainer = document.getElementById('galleryThumbnails');
  const prevBtn = document.getElementById('galleryPrevBtn');
  const nextBtn = document.getElementById('galleryNextBtn');
  let galleryData = [];
  let currentImageIndex = 0;
  try { const res = await fetch('/data/galeria.json'); galleryData = await res.json(); } catch(error) { console.error('Error al cargar galeria.json:', error); }

  if (galleryData.length === 0) {
    document.querySelector('.gallery-carousel-container').innerHTML = '<p>No hay imágenes cargadas aún.</p>';
    return;
  }

  function showImage(index) {
    if(!galleryData[index]) return;
    mainImage.style.opacity = 0;
    setTimeout(() => {
        mainImage.src = galleryData[index].img;
        mainImage.alt = galleryData[index].title;
        caption.textContent = galleryData[index].title;
        mainImage.style.opacity = 1;
    }, 300);
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('is-active', i === index);
    });
    currentImageIndex = index;
  }

  galleryData.forEach((item, index) => {
    const thumb = createEl(`<div class="thumbnail" style="background-image: url('${item.img}')" role="button" aria-label="Ver imagen ${index + 1}"></div>`);
    thumb.addEventListener('click', () => showImage(index));
    thumbnailsContainer.appendChild(thumb);
  });

  prevBtn.addEventListener('click', () => {
    const newIndex = (currentImageIndex - 1 + galleryData.length) % galleryData.length;
    showImage(newIndex);
  });
  nextBtn.addEventListener('click', () => {
    const newIndex = (currentImageIndex + 1) % galleryData.length;
    showImage(newIndex);
  });
  
  showImage(0);
})();

// =================================================================
// Lógica del Formulario de Contacto
// =================================================================
(function(){
  const form = document.getElementById('contactForm');
  const msg  = document.getElementById('formMsg');
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
// Lógica del Hero Carousel
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

// =================================================================
// LÓGICA DE LA PÁGINA DE DETALLE (CON ALERTAS DE PRUEBA)
// =================================================================
(async function() {
  const isDetailPage = document.getElementById('detailPage');
  if (!isDetailPage) return;

  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get('id');
  const propertyDetailDiv = document.querySelector('.property-detail');

  if (!propertyId) {
    propertyDetailDiv.innerHTML = '<h1>Error: No se ha especificado una propiedad.</h1>';
    return;
  }

  async function fetchAllData() {
    try {
      const [rentalsRes, projectsRes, salesRes] = await Promise.all([
        fetch('/data/alquileres.json'),
        fetch('/data/proyectos.json'),
        fetch('/data/ventas.json')
      ]);
      const rentals = await rentalsRes.json();
      const projectsData = await projectsRes.json();
      const sales = await salesRes.json();
      const allProjects = [...projectsData.terminados, ...projectsData.proceso];
      return [...rentals, ...allProjects, ...sales];
    } catch(e) {
      console.error("Error al cargar los datos de las propiedades:", e);
      propertyDetailDiv.innerHTML = `<h1>Error al cargar los datos.</h1>`;
      return [];
    }
  }

  const allData = await fetchAllData();
  const property = allData.find(item => item.id === propertyId);

  if (!property) {
    propertyDetailDiv.innerHTML = `<h1>Error: Propiedad no encontrada.</h1>`;
    return;
  }
  
  document.getElementById('propertyTitle').textContent = property.title;
  const priceEl = document.getElementById('propertyPrice');
  if (property.price) {
    const priceSuffix = property.status === 'alquilado' ? ' /mes' : '';
    priceEl.textContent = euro(property.price) + priceSuffix;
  } else {
    priceEl.style.display = 'none';
  }
  document.getElementById('propertyLongDesc').innerHTML = `<p>${property.long_desc.replace(/\n/g, '</p><p>')}</p>`;
  document.title = `${property.title} — Panthor Luxe`;

  const mainImage = document.getElementById('mainImage');
  const thumbnailsContainer = document.getElementById('thumbnails');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  let galleryImages = [];
  let currentImageIndex = 0;

  if (property.image_folder) {
    try {
      // INTENTAMOS CARGAR LA GALERÍA DESDE LA API
      const res = await fetch(`/api/getImages?folder=${property.image_folder}`);
      if (!res.ok) throw new Error(`El servidor respondió con estado ${res.status}`);
      
      galleryImages = await res.json();
      
      // === INICIO DE LA PRUEBA CON ALERTA ===
      // Si el código llega hasta aquí, todo ha ido bien.
      alert("ÉXITO: Se cargaron " + galleryImages.length + " imágenes desde la API.");
      // === FIN DE LA PRUEBA CON ALERTA ===

    } catch (e) {
      // === INICIO DE LA PRUEBA CON ALERTA ===
      // Si el código entra aquí, algo en el 'try' ha fallado.
      alert("ERROR: Se ha producido un fallo al cargar la galería. Mensaje: " + e.message);
      // === FIN DE LA PRUEBA CON ALERTA ===

      console.error(`Error al cargar la galería desde la API para la carpeta ${property.image_folder}`, e);
      galleryImages = [property.img]; // Plan B: usar solo la imagen de portada
    }
  } else {
    galleryImages = [property.img];
  }

  function showImage(index) {
    if(!galleryImages[index]) return;
    mainImage.style.opacity = 0;
    setTimeout(() => {
        mainImage.src = galleryImages[index];
        mainImage.alt = `${property.title} - imagen ${index + 1}`;
        mainImage.style.opacity = 1;
    }, 200);
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('is-active', i === index);
    });
    currentImageIndex = index;
  }

  if (galleryImages && galleryImages.length > 0) {
    if (galleryImages.length > 1) {
      thumbnailsContainer.innerHTML = '';
      galleryImages.forEach((src, index) => {
        const thumb = createEl(`<div class="thumbnail" style="background-image: url('${src}')" role="button" aria-label="Ver imagen ${index + 1}"></div>`);
        thumb.addEventListener('click', () => showImage(index));
        thumbnailsContainer.appendChild(thumb);
      });
      prevBtn.addEventListener('click', () => {
        const newIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        showImage(newIndex);
      });
      nextBtn.addEventListener('click', () => {
        const newIndex = (currentImageIndex + 1) % galleryImages.length;
        showImage(newIndex);
      });
      showImage(0);
    } else {
      mainImage.src = galleryImages[0];
      document.querySelector('.detail-gallery').classList.add('single-image');
    }
  } else {
    document.querySelector('.detail-gallery').style.display = 'none';
  }
})();