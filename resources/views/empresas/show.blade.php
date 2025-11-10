@extends('layouts.app')
@section('title','Perfil de Empresa')

@section('content')
<div class="max-w-6xl mx-auto space-y-4">

  {{-- Cabecera --}}
  <div class="bg-white border rounded-lg p-5 shadow-sm">
    <div class="flex flex-col md:flex-row justify-between gap-4">
      <div class="flex gap-5">
        <div class="w-36 h-36 rounded-lg bg-slate-200 flex items-center justify-center text-6xl text-slate-400">
          <i class="fa-solid fa-building"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold">{{ $empresa->nombre_comercial }}</h1>
          <h2 class="text-slate-600">{{ $empresa->razon_social }}</h2>
          <p class="text-sm text-slate-600 mt-2">
            <i class="fa-solid fa-calendar-alt mr-1"></i>
            Cliente desde:
            <span class="font-medium">
              {{ $empresa->fecha_creacion ? \Carbon\Carbon::parse($empresa->fecha_creacion)->format('d/m/Y') : '—' }}
            </span>
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <a href="{{ route('empresas.edit', $empresa->id_empresa) }}"
               class="btn btn-light px-3 py-1.5 border rounded bg-white hover:bg-slate-50">
              <i class="fa-solid fa-pencil mr-1"></i> Modificar
            </a>

            {{-- Eliminar (si tienes esta ruta) --}}
            @if(Route::has('empresas.destroy'))
            <form method="POST" action="{{ route('empresas.destroy', $empresa->id_empresa) }}"
                  onsubmit="return confirm('¿Eliminar empresa? Esta acción no se puede deshacer.');">
              @csrf @method('DELETE')
              <button class="px-3 py-1.5 border rounded bg-white text-red-600 hover:bg-red-50">
                <i class="fa-solid fa-trash mr-1"></i> Eliminar
              </button>
            </form>
            @endif
          </div>
        </div>
      </div>

      <div class="flex flex-col items-end gap-2 min-w-[260px]">
        {{-- Badge de estado de pago del servicio actual --}}
        @php
          $estadoPago = $servicio->estado_actual_pago ?? null;
          $badgeClass = 'bg-slate-600 text-white';
          $badgeIcon  = 'fa-spinner fa-spin';
          $badgeText  = 'Sin servicio activo';
          if ($servicio) {
            if ($estadoPago === 'Pagado') {
              $badgeClass = 'bg-green-600 text-white';
              $badgeIcon  = 'fa-check';
              $badgeText  = 'Pagado';
            } elseif ($estadoPago === 'Pendiente') {
              $badgeClass = 'bg-amber-400 text-slate-900';
              $badgeIcon  = 'fa-circle-exclamation';
              $badgeText  = 'Pendiente';
            }
          }
        @endphp

        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded {{ $badgeClass }}">
          <i class="fa-solid {{ $badgeIcon }}"></i> {{ $badgeText }}
        </span>

        <div class="flex gap-2">
          {{-- Cotizar: te lleva a crear cotización con esta empresa preseleccionada --}}
          <a href="{{ route('cotizaciones.create', ['id_empresa' => $empresa->id_empresa]) }}"
             class="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">
            <i class="fa-solid fa-file-invoice-dollar mr-1"></i> Cotizar
          </a>

          {{-- Cancelar servicio activo (si tienes ruta/acción) --}}
          @if($servicio && Route::has('servicios.cancelar'))
          <form method="POST" action="{{ route('servicios.cancelar', $servicio->id_servicio) }}"
                onsubmit="return confirm('¿Cancelar el servicio activo?');">
            @csrf
            <button class="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">
              <i class="fa-solid fa-ban mr-1"></i> Cancelar Servicio
            </button>
          </form>
          @endif
        </div>

        @if($servicio)
          <div class="w-full mt-1 bg-slate-50 border rounded p-2 text-right">
            <p class="text-sm text-slate-700">
              Monto mensual:
              <span class="font-semibold">
                {{ '$'.number_format($servicio->monto_mensual ?? 0, 2) }}
              </span>
            </p>
            <p class="text-sm text-slate-700">
              Próximo vencimiento:
              <span class="font-semibold">
                {{ \Carbon\Carbon::parse($servicio->fecha_proximo_vencimiento)->format('d/m/Y') }}
              </span>
            </p>
          </div>
        @endif
      </div>
    </div>
  </div>

  {{-- Contactos --}}
  <div class="bg-white border rounded-lg p-5 shadow-sm">
    <div class="flex items-center justify-between border-b pb-3 mb-4">
      <h2 class="text-lg font-semibold">Contactos</h2>
      @if(Route::has('contactos.store'))
      <a href="{{ route('contactos.create', ['id_empresa'=>$empresa->id_empresa]) }}"
         class="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">
        <i class="fa-solid fa-plus mr-1"></i> Añadir Contacto
      </a>
      @endif
    </div>

    <ul class="divide-y">
      @forelse($empresa->contactos as $c)
        <li class="py-3 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
            <i class="fa-regular fa-user"></i>
          </div>
          <div class="flex-1">
            <p class="font-medium">{{ $c->nombre }}</p>
            <p class="text-sm">
              @if($c->email)
                <a class="text-blue-600 hover:underline" href="mailto:{{ $c->email }}">{{ $c->email }}</a>
              @else
                <span class="text-slate-500">Sin email</span>
              @endif
              @if($c->telefono)
                <span class="text-slate-400 mx-2">•</span>
                <span class="text-slate-600">{{ $c->telefono }}</span>
              @endif
            </p>
          </div>
          @if(Route::has('contactos.edit'))
            <a href="{{ route('contactos.edit', $c->id_contacto) }}" class="px-2 py-1 border rounded bg-white hover:bg-slate-50">Editar</a>
          @endif
        </li>
      @empty
        <li class="py-6 text-center text-slate-500">Sin contactos registrados.</li>
      @endforelse
    </ul>
  </div>

  {{-- Documentación (placeholder, si aún no tienes tabla de documentos) --}}
  <div class="bg-white border rounded-lg p-5 shadow-sm">
    <div class="flex items-center justify-between border-b pb-3 mb-4">
      <h2 class="text-lg font-semibold">Documentación</h2>
      {{-- Si tienes una ruta de upload, colócala aquí --}}
      <button class="px-3 py-1.5 rounded border bg-white hover:bg-slate-50">
        <i class="fa-solid fa-upload mr-1"></i> Subir
      </button>
    </div>

    <ul class="space-y-3">
      <li class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fa-regular fa-file"></i>
          <span>Acta constitutiva</span>
        </div>
        <span class="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 border border-amber-200">Pendiente</span>
      </li>
      <li class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fa-regular fa-file"></i>
          <span>INE representante</span>
        </div>
        <span class="px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700 border">Inactivo</span>
      </li>
    </ul>
  </div>

  {{-- Horario de recolección (si existe en el detalle) --}}
  <div class="bg-white border rounded-lg p-5 shadow-sm">
    <div class="flex items-center justify-between border-b pb-3 mb-4">
      <h2 class="text-lg font-semibold">Horario de Cotización</h2>
    </div>

    @if($horario)
      @php
        $dias = [
          'lunes' => 'Lunes',
          'martes' => 'Martes',
          'miercoles' => 'Miércoles',
          'jueves' => 'Jueves',
          'viernes' => 'Viernes',
        ];
      @endphp
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
        @foreach($dias as $clave => $label)
          @php $activo = $horario[$clave] ?? false; @endphp
          <div class="text-center px-3 py-4 rounded border {{ $activo ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200' }}">
            {{ $label }}
          </div>
        @endforeach
      </div>
    @else
      <p class="text-center text-slate-500">Sin días configurados para el servicio.</p>
    @endif
  </div>

</div>
@endsection
