@extends('layouts.app')
@section('title','Editar Cotización')

@section('content')
<h2 class="text-lg font-semibold mb-4">Editar Cotización</h2>

@if($errors->any())
  <div class="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded">
    <ul class="list-disc pl-5">
      @foreach($errors->all() as $e)<li>{{ $e }}</li>@endforeach
    </ul>
  </div>
@endif

<form method="POST" action="{{ route('cotizaciones.update',$cotizacion) }}" class="space-y-4">
  @csrf @method('PUT')

  <div>
    <label class="block text-sm mb-1">Cliente (Empresa)</label>
    <select name="id_empresa" class="border px-3 py-2 rounded w-full" required>
      @foreach($empresas as $e)
        <option value="{{ $e->id_empresa }}" @selected($e->id_empresa==$cotizacion->id_empresa)>
          {{ $e->nombre_comercial }}
        </option>
      @endforeach
    </select>
  </div>

  <div class="grid md:grid-cols-3 gap-4">
    <div>
      <label class="block text-sm mb-1">Total</label>
      <input type="number" step="0.01" name="total" class="border px-3 py-2 rounded w-full"
             value="{{ $cotizacion->total }}" required>
    </div>
    <div>
      <label class="block text-sm mb-1">Estado</label>
      <select name="estado" class="border px-3 py-2 rounded w-full" required>
        @foreach(['Pendiente','Aceptada','Rechazada'] as $opt)
          <option value="{{ $opt }}" @selected($cotizacion->estado===$opt)>{{ $opt }}</option>
        @endforeach
      </select>
    </div>
    <div>
      <label class="block text-sm mb-1">Fecha</label>
      <input type="date" name="fecha_creacion" class="border px-3 py-2 rounded w-full"
             value="{{ $cotizacion->fecha_creacion }}">
    </div>
  </div>

  <div class="flex gap-2">
    <button class="px-4 py-2 bg-blue-600 text-white rounded">Actualizar</button>
    <a href="{{ route('cotizaciones.index') }}" class="px-4 py-2 bg-gray-200 rounded">Cancelar</a>
  </div>
</form>
@endsection
