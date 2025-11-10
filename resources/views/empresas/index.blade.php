@extends('layouts.app')
@section('title', 'Lista de Empresas')

@section('content')
<div class="max-w-6xl mx-auto bg-white p-5 rounded shadow">
  <h2 class="text-2xl font-bold mb-4">Empresas registradas</h2>

  <table class="w-full border-collapse">
    <thead>
      <tr class="bg-gray-100 border-b">
        <th class="p-2 text-left">Nombre comercial</th>
        <th class="p-2 text-left">Razón social</th>
        <th class="p-2 text-left">Contacto principal</th>
        <th class="p-2 text-left">Acciones</th>
      </tr>
    </thead>
    <tbody>
      @foreach($empresas as $e)
        <tr class="border-b hover:bg-gray-50">
          <td class="p-2">{{ $e->nombre_comercial }}</td>
          <td class="p-2">{{ $e->razon_social }}</td>
          <td class="p-2">
            {{ optional($e->contactoPrincipal)->nombre ?? '—' }}
          </td>
          <td class="p-2">
            <a href="{{ route('empresas.show', $e->id_empresa) }}" class="px-3 py-1 bg-blue-600 text-white rounded">
              <i class="fa-solid fa-id-card mr-1"></i> Perfil
            </a>
            <a href="{{ route('empresas.edit', $e->id_empresa) }}" class="px-3 py-1 bg-gray-200 rounded">
              <i class="fa-solid fa-pen mr-1"></i> Editar
            </a>
          </td>
        </tr>
      @endforeach

      @if($empresas->isEmpty())
        <tr><td colspan="4" class="p-3 text-center text-gray-500">No hay empresas registradas.</td></tr>
      @endif
    </tbody>
  </table>
</div>
@endsection
