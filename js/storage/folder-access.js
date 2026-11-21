/* Acceso a carpetas del ordenador. ÚNICO módulo que llama a las APIs nativas del navegador para carpetas
   (showDirectoryPicker, queryPermission, requestPermission, <input webkitdirectory>).

   Las ventanas del sistema (elegir carpeta, conceder permiso) no se pueden decorar por seguridad.
   Por eso SIEMPRE se muestra antes una ventana con el estilo de MatIA que explica qué va a pasar,
   y la ventana del navegador solo aparece cuando la persona pulsa el botón de esa ventana.

   API:
     supported                       → true si el navegador deja escribir en carpetas (Chrome, Edge)
     pick({ reason })                → Folder | null   (cualquier carpeta; se recuerda para la próxima vez)
     restore()                       → { folder, pending } | null   (sin ventanas: carpeta recordada con permiso, o pendiente de permiso)
     reconnect()                     → Folder | null   (pide de nuevo el permiso de la carpeta recordada)
     pickReadOnly()                  → Folder | null   (navegadores sin escritura: elegir carpeta para leer) */
MatIA.define('storage/folder-access', ['core/dom', 'storage/kv-store', 'storage/folders', 'ui/dialogs', 'ui/toast'], (dom, kv, folders, dialogs, toast) => {
  'use strict';
  const KEY = 'histDir';
  const supported = typeof window.showDirectoryPicker === 'function';

  const failed = (e, what) => { if (!e || e.name !== 'AbortError') toast('No se ha podido ' + what + ': ' + ((e && e.message) || e), 'aviso'); return null; };

  async function pick({ reason } = {}) {
    const ok = await dialogs.ask({
      title: 'Elige una carpeta para tus clases',
      text: (reason ? reason + ' ' : '') + 'Puedes usar cualquier carpeta de tu ordenador. Al pulsar «Elegir carpeta» se abrirá la ventana del navegador para buscarla y después te pedirá permiso para leer y guardar en ella.',
      label: 'Carpeta de clases', pio: 'escribiendo',
      buttons: [{ label: 'Cancelar', value: false, kind: 'ghost' }, { label: 'Elegir carpeta', value: true, kind: 'primary', focus: true }],
    });
    if (!ok) return null;
    try {
      const handle = await window.showDirectoryPicker({ id: 'matia-clases', mode: 'readwrite' });
      await kv.set(KEY, handle);
      return folders.fromHandle(handle);
    } catch (e) { return failed(e, 'abrir la carpeta'); }
  }

  async function restore() {
    if (!supported) return null;
    const handle = await kv.get(KEY);
    if (!handle || !handle.queryPermission) return null;
    try {
      const p = await handle.queryPermission({ mode: 'readwrite' });
      return p === 'granted' ? { folder: folders.fromHandle(handle), pending: null } : { folder: null, pending: handle.name };
    } catch (e) { return null; }
  }

  async function reconnect() {
    const handle = await kv.get(KEY);
    if (!handle) return null;
    const ok = await dialogs.ask({
      title: 'Volver a abrir «' + handle.name + '»',
      text: 'Por seguridad, el navegador olvida los permisos al cerrarlo. Al pulsar «Dar permiso» te preguntará si la pizarra puede leer y guardar en esa carpeta: responde «Permitir».',
      label: 'Carpeta de clases', pio: 'lectura',
      buttons: [{ label: 'Ahora no', value: false, kind: 'ghost' }, { label: 'Dar permiso', value: true, kind: 'primary', focus: true }],
    });
    if (!ok) return null;
    try {
      if ((await handle.requestPermission({ mode: 'readwrite' })) === 'granted') return folders.fromHandle(handle);
      toast('Sin permiso no se puede usar la carpeta. Puedes elegir otra.', 'aviso');
      return null;
    } catch (e) { return failed(e, 'reconectar la carpeta'); }
  }

  async function pickReadOnly() {
    const ok = await dialogs.ask({
      title: 'Elige la carpeta de tus clases',
      text: 'Este navegador solo deja LEER carpetas. Al pulsar «Elegir carpeta» se abrirá su ventana para buscarla (puede preguntarte si quieres subir los archivos: solo se leen aquí, no se envían a ningún sitio). Para guardar, la clase se descargará y tendrás que moverla a esa carpeta. Con Chrome o Edge se guarda directamente.',
      label: 'Carpeta de clases', pio: 'lectura',
      buttons: [{ label: 'Cancelar', value: false, kind: 'ghost' }, { label: 'Elegir carpeta', value: true, kind: 'primary', focus: true }],
    });
    if (!ok) return null;
    const inp = dom.$('#histDirIn');
    return new Promise((res) => {
      const done = () => {
        inp.removeEventListener('change', done);
        inp.removeEventListener('cancel', done);
        const files = Array.from(inp.files || []);
        const first = files[0];
        const name = (first && (first.webkitRelativePath || '').split('/')[0]) || 'carpeta';
        inp.value = '';
        res(files.length ? folders.fromFiles(name, files) : null);
      };
      inp.addEventListener('change', done);
      inp.addEventListener('cancel', done); // si se cancela el selector no queda un oyente colgado
      inp.click();
    });
  }

  return { supported, pick, restore, reconnect, pickReadOnly };
});
