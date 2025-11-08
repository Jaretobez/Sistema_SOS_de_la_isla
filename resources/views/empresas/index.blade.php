@extends('layouts.app')
@section('title','Gestión de Empresas')

@section('content')
<div class="panel">
    <h2>Gestión de Empresas y Contactos</h2>

    <button id="btn-anadir-nuevo" class="btn-anadir">+ Añadir Nuevo</button>

    <form id="form-busqueda" class="form-busqueda">
        <input type="search" id="busqueda" placeholder="Buscar empresa, contacto, email...">
        <button type="submit">Buscar</button>
    </form>

    <table class="tabla-empresas">
        <thead>
        <tr>
            <th>Nombre Comercial</th>
            <th>Contacto Principal</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Acciones</th>
        </tr>
        </thead>
        <tbody id="tabla-body"></tbody>
    </table>

    <p id="no-resultados" style="display:none;text-align:center;padding:1rem;">
        No hay empresas para mostrar.
    </p>
</div>

{{-- Modal (lo incluimos en el HTML para evitar fetch extra) --}}
<div id="empresa-modal" class="modal hidden">
  <div class="modal-content">
    <h3 id="modal-titulo">Añadir Nueva Empresa</h3>
    <button id="modal-close-btn" type="button" class="modal-close">×</button>

    <form id="form-empresa-nueva">
      <input type="hidden" id="form-mode" value="anadir">
      <input type="hidden" id="empresa-id-edit" value="">
      <div>
        <label>Nombre comercial</label>
        <input id="emp-nombre-comercial" required>
      </div>
      <div>
        <label>Razón social</label>
        <input id="emp-razon-social">
      </div>
      <div>
        <label>Tipo</label>
        <input id="emp-tipo">
      </div>
      <div>
        <label>Ruta</label>
        <input id="emp-ruta" type="number">
      </div>
      <div>
        <label>Dirección</label>
        <input id="emp-direccion">
      </div>

      <hr>
      <div id="contactos-list"></div>
      <button type="button" id="btn-add-contacto">+ Añadir contacto</button>

      <div style="margin-top:1rem">
        <button id="btn-guardar-empresa" type="submit">Guardar Empresa</button>
      </div>
    </form>
  </div>
</div>
@endsection

@push('scripts')
    @vite(['resources/js/empresas.js'])
@endpush


