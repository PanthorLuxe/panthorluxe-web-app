// Menú móvil
const burger = document.querySelector('.hamburger');
const nav = document.getElementById('mainnav');
if (burger && nav){
  burger.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// ... (El resto del script.js que teníamos antes) ...

// Formulario → Azure Functions (CON DEPURACIÓN)
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
        // CAMBIO PARA DEPURACIÓN: Mostramos el error detallado en la consola
        console.error('Error detallado recibido del servidor:', json.debug_info);
      }
    } catch (error) {
      console.error('Error de conexión al enviar el formulario:', error);
      msg.textContent = 'Error de conexión. Intenta de nuevo.';
    }
  });
})();

// ... (El resto del script.js que teníamos antes, si lo había) ...