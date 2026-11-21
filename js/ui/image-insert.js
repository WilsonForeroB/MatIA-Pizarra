/* Insertar imágenes: botón «Imagen», pegar (Ctrl+V) y arrastrar un archivo sobre la hoja.
   El guardado en la carpeta de clases («imagenes/») lo hace storage/assets. */
MatIA.define('ui/image-insert', ['core/dom'], (dom) => {
  'use strict';
  const { $ } = dom;
  const R = (n) => MatIA.require(n);
  const assets = () => R('storage/assets');

  $('#imgBtn').addEventListener('click', () => $('#imgIn').click());
  $('#imgIn').addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) await assets().insertFromFile(f);
  });
  // pegar: solo si el portapapeles trae una imagen (el texto se pega como siempre)
  document.addEventListener('paste', async (e) => {
    const dt = e.clipboardData;
    if (!dt || !Array.from(dt.items || []).some((it) => it.kind === 'file' && /^image\//.test(it.type))) return;
    e.preventDefault();
    await assets().insertFromClipboardOrDrop(dt);
  });
  // arrastrar archivos de imagen sobre la hoja
  const sheet = $('#sheet');
  const hasImage = (dt) => dt && Array.from(dt.items || []).some((it) => it.kind === 'file' && /^image\//.test(it.type));
  sheet.addEventListener('dragover', (e) => { if (hasImage(e.dataTransfer)) { e.preventDefault(); sheet.classList.add('img-drop'); } });
  sheet.addEventListener('dragleave', () => sheet.classList.remove('img-drop'));
  sheet.addEventListener('drop', async (e) => {
    sheet.classList.remove('img-drop');
    if (!hasImage(e.dataTransfer)) return;
    e.preventDefault();
    await assets().insertFromClipboardOrDrop(e.dataTransfer);
  });
  return {};
});
