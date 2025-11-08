// resources/js/empresas.js
document.addEventListener('DOMContentLoaded', () => {
  const API_URL = '/api/empresas';

  const tablaBody = document.getElementById("tabla-body");
  const noResultados = document.getElementById("no-resultados");
  const formBusqueda = document.getElementById("form-busqueda");
  const inputBusqueda = document.getElementById("busqueda");
  const btnAnadirNuevo = document.getElementById("btn-anadir-nuevo");

  const modal = document.getElementById('empresa-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const titulo = document.getElementById("modal-titulo");
  const form = document.getElementById("form-empresa-nueva");
  const formMode = document.getElementById("form-mode");
  const empresaIdEdit = document.getElementById("empresa-id-edit");
  const btnGuardar = document.getElementById("btn-guardar-empresa");
  const contactosList = document.getElementById("contactos-list");
  const btnAnadirContacto = document.getElementById("btn-add-contacto");

  const csrf = document.querySelector('meta[name="csrf-token"]').content;

  function abrir()  { modal.classList.remove('hidden'); }
  function cerrar() { modal.classList.add('hidden');  }

  btnAnadirContacto.addEventListener('click', () => anadirBloqueContacto(contactosList));
  modalClose.addEventListener('click', cerrar);

  function anadirBloqueContacto(container, contacto = {}) {
    const id = `c-${Date.now()}-${Math.floor(Math.random()*100)}`;
    const wrap = document.createElement('div');
    wrap.className = 'contacto-block';
    wrap.innerHTML = `
      <div class="contacto-block-label">${container.children.length===0?'Contacto Principal':'Contacto Adicional'}</div>
      ${container.children.length>0 ? '<button type="button" class="btn-remove-contacto">&times;</button>' : ''}
      <div class="contacto-block-inputs">
        <input type="hidden" class="cont-id" value="${contacto.id_contacto ?? ''}">
        <div><label>Nombre</label><input class="cont-nombre" value="${contacto.nombre ?? ''}" required></div>
        <div><label>Email</label><input class="cont-email" type="email" value="${contacto.email ?? ''}" required></div>
        <div><label>Teléfono</label><input class="cont-telefono" value="${contacto.telefono ?? ''}"></div>
      </div>
    `;
    container.appendChild(wrap);
    wrap.querySelector('.btn-remove-contacto')?.addEventListener('click', () => {
      wrap.remove();
      const first = container.querySelector('.contacto-block');
      if (first) first.querySelector('.contacto-block-label').textContent = 'Contacto Principal';
    });
  }

  async function cargarDatos(termino = '') {
    const url = new URL(API_URL, location.origin);
    if (termino) url.searchParams.set('termino', termino);

    const r = await fetch(url, { headers: { 'X-Requested-With':'XMLHttpRequest' }});
    const data = await r.json();
    renderTabla(data);
  }

  function renderTabla(empresas) {
    tablaBody.innerHTML = '';
    noResultados.style.display = empresas.length ? 'none' : 'block';

    empresas.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${e.nombre_comercial}</strong><div class="razon-social">${e.razon_social ?? ''}</div></td>
        <td>${e.contacto_nombre ?? '—'}</td>
        <td>${e.contacto_email ? `<a href="mailto:${e.contacto_email}">${e.contacto_email}</a>` : '—'}</td>
        <td>${e.contacto_telefono ?? '—'}</td>
        <td>
          <button class="btn-accion ver" data-id="${e.id_empresa}" title="Ver"><i class="fa fa-eye"></i></button>
          <button class="btn-accion modificar" data-id="${e.id_empresa}" title="Modificar"><i class="fa fa-pencil"></i></button>
          <button class="btn-accion eliminar" data-id="${e.id_empresa}" title="Eliminar"><i class="fa fa-trash"></i></button>
        </td>
      `;
      tablaBody.appendChild(tr);
    });
  }

  async function abrirModal(modo, id=null) {
    form.reset();
    contactosList.innerHTML = '';
    formMode.value = modo;
    empresaIdEdit.value = id ?? '';
    if (modo === 'anadir') {
      titulo.textContent = 'Añadir Nueva Empresa';
      btnGuardar.textContent = 'Guardar Empresa';
      anadirBloqueContacto(contactosList);
      abrir();
      return;
    }
    // modificar: cargar datos completos
    titulo.textContent = 'Modificar Empresa';
    btnGuardar.textContent = 'Guardar Cambios';
    const r = await fetch(`${API_URL}/${id}`);
    const data = await r.json();
    document.getElementById("emp-nombre-comercial").value = data.empresa.nombre_comercial ?? '';
    document.getElementById("emp-razon-social").value    = data.empresa.razon_social ?? '';
    document.getElementById("emp-tipo").value            = data.empresa.tipo ?? '';
    document.getElementById("emp-ruta").value            = data.empresa.id_ruta ?? '';
    document.getElementById("emp-direccion").value       = data.empresa.direccion ?? '';

    if (data.contactos?.length) data.contactos.forEach(c=>anadirBloqueContacto(contactosList,c));
    else anadirBloqueContacto(contactosList);

    abrir();
  }

  async function guardar(e) {
    e.preventDefault();

    const modo = formMode.value;
    const body = {
      empresa: {
        nombre_comercial: document.getElementById("emp-nombre-comercial").value,
        razon_social:     document.getElementById("emp-razon-social").value,
        tipo:             document.getElementById("emp-tipo").value,
        id_ruta:          document.getElementById("emp-ruta").value,
        direccion:        document.getElementById("emp-direccion").value,
      },
      contactos: Array.from(document.querySelectorAll('#contactos-list .contacto-block')).map((b,i)=>({
        id_contacto: b.querySelector('.cont-id').value || null,
        nombre:      b.querySelector('.cont-nombre').value,
        email:       b.querySelector('.cont-email').value,
        telefono:    b.querySelector('.cont-telefono').value,
      })),
    };

    if (!body.contactos.length) { alert('Añade al menos un contacto.'); return; }

    const id = empresaIdEdit.value;
    const opts = {
      method: (modo === 'anadir') ? 'POST' : 'PUT',
      headers: {
        'Content-Type':'application/json',
        'X-CSRF-TOKEN': csrf,
        'X-Requested-With':'XMLHttpRequest'
      },
      body: JSON.stringify(body)
    };
    const url = (modo === 'anadir') ? API_URL : `${API_URL}/${id}`;
    const r = await fetch(url, opts);
    const res = await r.json();

    if (res.success) {
      cerrar();
      await cargarDatos();
    } else {
      alert(res.error || 'Error');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar la empresa?')) return;
    const r = await fetch(`${API_URL}/${id}`, {
      method:'DELETE',
      headers: { 'X-CSRF-TOKEN': csrf, 'X-Requested-With':'XMLHttpRequest' }
    });
    const res = await r.json();
    if (res.success) await cargarDatos();
    else alert(res.error || 'Error al eliminar');
  }

  // Eventos
  formBusqueda.addEventListener('submit', e => { e.preventDefault(); cargarDatos(inputBusqueda.value); });
  btnAnadirNuevo.addEventListener('click', () => abrirModal('anadir'));
  form.addEventListener('submit', guardar);

  tablaBody.addEventListener('click', (e)=>{
    const b = e.target.closest('button');
    if (!b) return;
    const id = b.dataset.id;
    if (b.classList.contains('modificar')) return abrirModal('modificar', id);
    if (b.classList.contains('eliminar'))  return eliminar(id);
    if (b.classList.contains('ver'))       window.open(`/perfil/${id}`,'_blank'); // adapta si tienes perfil
  });

  // inicio
  cargarDatos();
});
