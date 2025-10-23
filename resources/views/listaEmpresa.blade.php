@extends('layouts.app')
@section('usuario', auth()->user()->name ?? 'Vendedor')

@section('content')
    <div class="panel">
        <h2>Lista de Empresas</h2>

        {{-- Formulario de búsqueda y filtro --}}
        <form action="{{ url('listaEmpresa') }}" method="GET" class="form-busqueda" style="margin-bottom:1rem; display:flex; gap:0.5rem; align-items:center;">
            <input
                type="search"
                name="busqueda"
                placeholder="Buscar empresa o razón social..."
                value="{{ request('busqueda') }}"
                style="padding:0.5rem; flex:1;"
            />

            <select name="estado" style="padding:0.5rem;">
                <option value="">Todos</option>
                <option value="activo" {{ request('estado') == 'activo' ? 'selected' : '' }}>Activo</option>
                <option value="inactivo" {{ request('estado') == 'inactivo' ? 'selected' : '' }}>Inactivo</option>
            </select>

            <button type="submit" style="padding:0.5rem 1rem;">Buscar</button>
        </form>

        {{-- Tabla de resultados --}}
        @if(isset($empresas) && $empresas->count())
            <table class="tabla-empresas" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="text-align:left; border-bottom:1px solid #ddd;">
                        <th style="padding:0.5rem;">Empresa</th>
                        <th style="padding:0.5rem;">Fecha de registro</th>
                        <th style="padding:0.5rem;">Estado</th>
                        <th style="padding:0.5rem;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($empresas as $empresa)
                        <tr style="border-bottom:1px solid #f1f1f1;">
                            <td style="padding:0.5rem;">
                                <strong>{{ $empresa->EMPRESA }}</strong>
                                @if(!empty($empresa->RAZON_SOCIAL))
                                    <div style="font-size:0.9rem; color:#666;">{{ $empresa->RAZON_SOCIAL }}</div>
                                @endif
                            </td>
                            <td style="padding:0.5rem;">{{ $empresa->FECHA_REGISTRO ? date('d/m/Y H:i', strtotime($empresa->FECHA_REGISTRO)) : '—' }}</td>
                            <td style="padding:0.5rem;">{{ $empresa->ESTADO ?? ($empresa->estado ?? '—') }}</td>
                            <td style="padding:0.5rem;">
                                {{-- Botón sin función (placeholder) --}}
                                <button type="button" class="btn-accion" style="padding:0.35rem 0.6rem;">Ver</button>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p>No hay empresas para mostrar.</p>
        @endif
    </div>
@endsection
