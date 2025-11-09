@extends('layouts.app')
@section('title','Empresas')

@section('content')
<div class="space-y-4">
  <div class="flex items-center justify-between">
    <form method="GET" action="{{ route('empresas.index') }}" class="flex gap-2">
      <input name="q" value="{{ $t }}" placeholder="Buscar empresa/contacto/email..." class="border px-3 py-2 rounded">
      <button class="px-3 py-2 bg-gray-800 text-white rounded">Buscar</button>
    </form>

    <a href="{{ route('empresas.create') }}" class="px-3 py-2 bg-blue-600 text-white rounded">+ Añadir nueva</a>
  </div>

  @if(session('ok'))
    <div class="p-3 bg-green-100 border border-green-200 rounded text-green-800">
      {{ session('ok') }}
    </div>
  @endif

  <div class="overflow-x-auto bg-white rounded shadow">
    <table class="min-w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="text-left p-3">Nombre Comercial</th>
          <th class="text-left p-3">Contacto Principal</th>
          <th class="text-left p-3">Email</th>
          <th class="text-left p-3">Teléfono</th>
          <th class="text-right p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        @forelse($empresas as $e)
          <tr class="border-t">
            <td class="p-3">
              <div class="font-semibold">{{ $e->nombre_comercial }}</div>
              <div class="text-gray-500">{{ $e->razon_social }}</div>
            </td>
            <td class="p-3">{{ optional($e->contactoPrincipal)->nombre ?? '—' }}</td>
            <td class="p-3">
              @if(optional($e->contactoPrincipal)->email)
                <a class="text-blue-600 underline" href="mailto:{{ $e->contactoPrincipal->email }}">
                  {{ $e->contactoPrincipal->email }}
                </a>
              @else — @endif
            </td>
            <td class="p-3">{{ optional($e->contactoPrincipal)->telefono ?? '—' }}</td>
            <td class="p-3 text-right">
              <a class="px-2 py-1 bg-yellow-500 text-white rounded" href="{{ route('empresas.edit',$e) }}">Editar</a>
              <form method="POST" action="{{ route('empresas.destroy',$e) }}" class="inline-block"
                    onsubmit="return confirm('¿Eliminar {{ $e->nombre_comercial }}?');">
                @csrf @method('DELETE')
                <button class="px-2 py-1 bg-red-600 text-white rounded">Eliminar</button>
              </form>
            </td>
          </tr>
        @empty
          <tr><td colspan="5" class="p-6 text-center text-gray-500">No hay empresas</td></tr>
        @endforelse
      </tbody>
    </table>
  </div>

  <div>{{ $empresas->links() }}</div>
</div>
@endsection
