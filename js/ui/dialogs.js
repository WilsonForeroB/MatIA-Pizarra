/* Servicio único de ventanas con el estilo de MatIA (diálogo #ask con Pío).
   Sustituye a alert/confirm/prompt del navegador: en la pizarra NO se usan las ventanas nativas.
     await dialogs.ask({ title, text, label, pio, warn, buttons:[{label, value, kind:'primary'|'danger'|'ghost', focus}] })
     await dialogs.alert(title, text)                      → true
     await dialogs.confirm(title, text, { ok, danger })    → true | false
     await dialogs.prompt(title, text, { value, placeholder, ok }) → texto | null
   Escape o cerrar la ventana devuelve null (o false en confirm). */
MatIA.define('ui/dialogs', ['core/dom', 'assets/pio'], (dom, pio) => {
  'use strict';
  const { $ } = dom;
  const dlg = $('#ask');
  let pending = null;
  const finish = (v) => { const r = pending; pending = null; if (dlg.open) dlg.close(); if (r) r(v); };
  dlg.addEventListener('cancel', () => finish(null));
  dlg.addEventListener('close', () => finish(null));

  function ask({ title, text, label = 'Pío pregunta', pio: pose = 'idea', warn = false, buttons, input = null }) {
    if (pending) finish(null);
    $('#askTitle').textContent = title;
    $('#askText').textContent = text || '';
    $('#askLabel').textContent = label;
    dlg.classList.toggle('aviso', !!warn);
    const pp = $('#askPio'); pp.textContent = ''; pp.appendChild(pio.badge(pose, '', 'Pío'));
    const field = $('#askField'), inp = $('#askInput');
    field.hidden = !input;
    if (input) { inp.value = input.value || ''; inp.placeholder = input.placeholder || ''; }
    const acts = $('#askActs'); acts.textContent = '';
    let focusBtn = null;
    for (const b of buttons) {
      const bt = document.createElement('button');
      bt.type = 'button';
      bt.className = 'mi-btn mi-btn--sm' + (b.kind === 'primary' ? ' mi-btn--primary' : b.kind === 'danger' ? ' mi-btn--danger' : b.kind === 'ghost' ? ' mi-btn--ghost' : '');
      bt.textContent = b.label;
      bt.addEventListener('click', () => finish(input && b.value === true ? inp.value : b.value));
      acts.appendChild(bt);
      if (b.focus) focusBtn = bt;
    }
    return new Promise((res) => {
      pending = res;
      dlg.showModal();
      if (input) { inp.focus(); inp.select(); } else (focusBtn || acts.lastElementChild).focus();
    });
  }
  $('#askInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); finish($('#askInput').value); } });

  const alert = (title, text, o = {}) => ask({ title, text, label: o.label || 'Aviso', pio: o.pio || 'lectura', warn: !!o.warn,
    buttons: [{ label: o.ok || 'Entendido', value: true, kind: 'primary', focus: true }] }).then(() => true);
  const confirm = (title, text, o = {}) => ask({ title, text, label: o.label || 'Pío pregunta', pio: o.pio || 'idea', warn: !!o.danger,
    buttons: [{ label: o.cancel || 'Cancelar', value: false, kind: 'ghost' }, { label: o.ok || 'Aceptar', value: true, kind: o.danger ? 'danger' : 'primary', focus: true }] }).then((v) => v === true);
  const prompt = (title, text, o = {}) => ask({ title, text, label: o.label || 'Pío pregunta', pio: o.pio || 'escribiendo', input: { value: o.value, placeholder: o.placeholder },
    buttons: [{ label: o.cancel || 'Cancelar', value: null, kind: 'ghost' }, { label: o.ok || 'Aceptar', value: true, kind: 'primary' }] }).then((v) => (typeof v === 'string' ? v : null));

  return { ask, alert, confirm, prompt };
});
