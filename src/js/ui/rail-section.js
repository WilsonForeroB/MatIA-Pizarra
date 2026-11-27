/* Secciones desplegables de la barra lateral («Línea», «Formato»…): una cabecera con ▸/▾ que abre o
   cierra el contenido del grupo. Así las ayudas de la línea activa viven en el lateral (no tapan la hoja)
   y solo ocupan sitio si se necesitan. Se recuerda en este navegador si cada sección está abierta. */
MatIA.define('ui/rail-section', [], () => {
  'use strict';
  const KEY = 'matia-rail-abiertas';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const store = (id, open) => { try { const o = load(); o[id] = open; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };

  /** Convierte el grupo en sección desplegable: mete su contenido en un cuerpo y le pone cabecera. */
  function make(group, id, label, openByDefault = false) {
    const saved = load();
    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'rsec-h';
    head.innerHTML = '<svg class="rsec-chev" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg><span></span>';
    head.querySelector('span').textContent = label;
    const body = document.createElement('div');
    body.className = 'rsec-b';
    body.id = 'rsec-' + id;
    while (group.firstChild) body.appendChild(group.firstChild);
    group.classList.add('rsec');
    group.append(head, body);
    head.setAttribute('aria-controls', body.id);
    const set = (open) => {
      body.hidden = !open;
      head.setAttribute('aria-expanded', String(open));
      head.title = (open ? 'Ocultar ' : 'Mostrar ') + label.toLowerCase();
    };
    set(id in saved ? !!saved[id] : openByDefault);
    head.addEventListener('mousedown', (e) => e.preventDefault()); // el cursor sigue en la línea
    head.addEventListener('click', () => { const open = body.hidden; set(open); store(id, open); });
    return { head, body, set, isOpen: () => !body.hidden };
  }
  return { make };
});
