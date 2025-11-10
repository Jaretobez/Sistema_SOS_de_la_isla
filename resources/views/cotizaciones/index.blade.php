@extends('layouts.app')
@section('title','Gestión de Cotizaciones')

@section('content')
<div class="panel">

  <h2 class="text-xl font-semibold mb-4">Gestión de Cotizaciones</h2>

  {{-- Tabs simples sin JS extra (usa anclas) --}}
  <div class="tabs mb-4 flex gap-2">
    <a href="#tab-crear" class="tab-button px-3 py-2 rounded bg-gray-800 text-white">Crear Cotización</a>
    <a href="#tab-guardadas" class="tab-button px-3 py-2 rounded bg-gray-200">Cotizaciones Guardadas</a>
  </div>

  @if(session('ok'))
    <div class="p-3 mb-4 bg-green-100 border border-green-200 text-green-800 rounded">{{ session('ok') }}</div>
  @endif

  {{-- ======== TAB CREAR: Buscar clientes ======== --}}
  <div id="tab-crear" class="tab-content space-y-3">
    <form method="GET" action="{{ route('cotizaciones.index') }}" class="form-busqueda flex gap-2">
      <input type="search" name="q_cli" value="{{ $qCli }}" placeholder="Buscar cliente para cotizar..." class="border px-3 py-2 rounded w-full">
      {{-- preservar paginación de la otra tabla / filtros --}}
      <input type="hidden" name="q_cot" value="{{ $qCot }}">
      <input type="hidden" name="estado" value="{{ $estado }}">
      <button class="px-3 py-2 bg-gray-800 text-white rounded">Buscar</button>
    </form>

    <div class="overflow-x-auto bg-white rounded shadow">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="text-left p-3">Empresa</th>
          <th class="text-left p-3">Contacto Principal</th>
          <th class="text-left p-3">Acciones</th>
        </tr>
        </thead>
        <tbody>
        @forelse($empresas as $e)
          <tr class="border-t">
            <td class="p-3">
              <div class="font-semibold">{{ $e->nombre_comercial }}</div>
              <div class="text-gray-500">{{ $e->razon_social }}</div>
            </td>
            <td class="p-3">
              <div>{{ optional($e->contactoPrincipal)->nombre ?? '—' }}</div>
              <div class="text-gray-500">
                @if(optional($e->contactoPrincipal)->email)
                  <a class="text-blue-600 underline" href="mailto:{{ $e->contactoPrincipal->email }}">{{ $e->contactoPrincipal->email }}</a>
                @endif
              </div>
            </td>
            <td class="p-3">
              <a class="px-3 py-2 bg-blue-600 text-white rounded"
                 href="{{ route('cotizaciones.create', ['id_empresa'=>$e->id_empresa]) }}">
                Nueva cotización
              </a>
            </td>
          </tr>
        @empty
          <tr><td colspan="3" class="p-6 text-center text-gray-500">No se encontraron clientes.</td></tr>
        @endforelse
        </tbody>
      </table>
    </div>

    <div>{{ $empresas->appends(['q_cot'=>$qCot,'estado'=>$estado])->links() }}</div>
  </div>

  <hr class="my-6">

  {{-- ======== TAB GUARDADAS: Listado + filtros ======== --}}
  <div id="tab-guardadas" class="tab-content space-y-3">
    <form method="GET" action="{{ route('cotizaciones.index') }}" class="form-busqueda flex gap-2">
      <input type="search" name="q_cot" value="{{ $qCot }}" placeholder="Buscar por folio o cliente..." class="border px-3 py-2 rounded w-full">
      <select name="estado" class="border px-3 py-2 rounded">
        <option value="">Todos los Estados</option>
        @foreach(['Pendiente','Aceptada','Rechazada'] as $opt)
          <option value="{{ $opt }}" @selected($estado===$opt)>{{ $opt }}</option>
        @endforeach
      </select>
      {{-- preservar búsqueda de clientes --}}
      <input type="hidden" name="q_cli" value="{{ $qCli }}">
    </form>

    <div class="overflow-x-auto bg-white rounded shadow">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="text-left p-3">Folio</th>
          <th class="text-left p-3">Cliente</th>
          <th class="text-left p-3">Total</th>
          <th class="text-left p-3">Estado</th>
          <th class="text-right p-3">Acciones</th>
        </tr>
        </thead>
        <tbody>
        @forelse($cotizaciones as $c)
          <tr class="border-t">
            <td class="p-3">{{ $c->folio }}</td>
            <td class="p-3">{{ optional($c->empresa)->nombre_comercial }}</td>
            <td class="p-3">${{ number_format($c->total, 2) }}</td>
            <td class="p-3">{{ $c->estado }}</td>
            <td class="p-3 text-right">
              <a class="px-2 py-1 bg-yellow-500 text-white rounded" href="{{ route('cotizaciones.edit',$c) }}">Editar</a>
              <form class="inline-block" method="POST" action="{{ route('cotizaciones.destroy',$c) }}"
                    onsubmit="return confirm('¿Eliminar {{ $c->folio }}?');">
                @csrf @method('DELETE')
                <button class="px-2 py-1 bg-red-600 text-white rounded">Eliminar</button>
              </form>
            </td>
          </tr>
        @empty
          <tr><td colspan="5" class="p-6 text-center text-gray-500">No se encontraron cotizaciones.</td></tr>
        @endforelse
        </tbody>
      </table>
    </div>

    <div>{{ $cotizaciones->appends(['q_cli'=>$qCli])->links() }}</div>
  </div>

</div>
@endsection
