@extends('layouts.app')
@section('title','Gestión de Facturación')

@section('content')
<h2 class="text-lg font-semibold mb-4">Gestión de Facturación</h2>

@if (session('status'))
  <div class="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-800">
    {{ session('status') }}
  </div>
@endif

<form method="GET" class="form-busqueda flex flex-wrap items-center gap-2 mb-4">
  <input type="search" name="q" value="{{ $q }}" placeholder="Buscar por nombre de empresa..."
         class="border rounded px-3 py-2 flex-1 min-w-[220px]">
  <select name="estado" class="border rounded px-3 py-2">
    <option value="">Todos los Estados</option>
    <option value="Pendiente" @selected($estado==='Pendiente')>Pendiente</option>
    <option value="Pagado" @selected($estado==='Pagado')>Pagado</option>
  </select>
  <button class="px-4 py-2 bg-gray-800 text-white rounded">Buscar</button>
</form>

<div class="overflow-x-auto">
  <table class="tabla-empresas min-w-full text-sm">
    <thead class="bg-gray-50">
      <tr>
        <th class="text-left p-2">Empresa</th>
        <th class="text-left p-2">Monto a Pagar</th>
        <th class="text-left p-2">Fecha de Facturación</th>
        <th class="text-left p-2">Estado de Pago</th>
        <th class="text-left p-2">Acciones</th>
      </tr>
    </thead>
    <tbody>
      @forelse($servicios as $s)
        @php
          $nombreEmpresa = $s->empresa->nombre_comercial ?? 'Empresa Desconocida';
          $estadoPago = $s->estado_actual_pago ?? 'Pendiente';
          $badgeClass = $estadoPago === 'Pagado' ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-yellow-100 text-yellow-800 border-yellow-200';
        @endphp
        <tr class="border-t">
          <td class="p-2 font-medium">{{ $nombreEmpresa }}</td>
          <td class="p-2">
            {{ Number::currency($s->monto_mensual ?? 0, 'MXN', locale: 'es-MX') }}
          </td>
          <td class="p-2">
            {{ \Carbon\Carbon::parse($s->fecha_proximo_vencimiento)->translatedFormat('d \\de F \\de Y') }}
          </td>
          <td class="p-2">
            <span class="inline-block px-2 py-0.5 border rounded {{ $badgeClass }}">
              {{ $estadoPago }}
            </span>
          </td>
          <td class="p-2">
            @if($estadoPago === 'Pagado')
              <button class="px-3 py-1 rounded bg-gray-200 text-gray-600 cursor-not-allowed" disabled>
                <i class="fa fa-check"></i> Pagado
              </button>
            @else
              <form method="POST" action="{{ route('facturacion.pagar', $s->id_servicio) }}"
                    onsubmit="return confirm('¿Marcar como PAGADO?');" class="inline-block">
                @csrf
                <button class="px-3 py-1 rounded bg-blue-600 text-white">
                  Marcar como Pagado
                </button>
              </form>
            @endif
          </td>
        </tr>
      @empty
        <tr>
          <td colspan="5" class="p-4 text-center text-gray-500">
            No se encontraron facturas pendientes.
          </td>
        </tr>
      @endforelse
    </tbody>
  </table>
</div>

<div class="mt-4">
  {{ $servicios->links() }}
</div>
@endsection
