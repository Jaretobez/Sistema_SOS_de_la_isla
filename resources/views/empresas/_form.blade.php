@csrf
<div class="grid md:grid-cols-2 gap-4">
  <div>
    <label class="block text-sm mb-1">Nombre comercial</label>
    <input name="nombre_comercial" value="{{ old('nombre_comercial', $empresa->nombre_comercial ?? '') }}" class="w-full border px-3 py-2 rounded" required>
  </div>
  <div>
    <label class="block text-sm mb-1">Razón social</label>
    <input name="razon_social" value="{{ old('razon_social', $empresa->razon_social ?? '') }}" class="w-full border px-3 py-2 rounded">
  </div>
  <div>
    <label class="block text-sm mb-1">Tipo</label>
    <input name="tipo" value="{{ old('tipo', $empresa->tipo ?? '') }}" class="w-full border px-3 py-2 rounded">
  </div>
  <div>
    <label class="block text-sm mb-1">Ruta (texto)</label>
    <input name="id_ruta" value="{{ old('id_ruta', $empresa->id_ruta ?? '') }}" class="w-full border px-3 py-2 rounded">
  </div>
  <div class="md:col-span-2">
    <label class="block text-sm mb-1">Dirección</label>
    <input name="direccion" value="{{ old('direccion', $empresa->direccion ?? '') }}" class="w-full border px-3 py-2 rounded">
  </div>
  <div>
    <label class="block text-sm mb-1">Fecha creación</label>
    <input type="date" name="fecha_creacion" value="{{ old('fecha_creacion', $empresa->fecha_creacion ?? '') }}" class="w-full border px-3 py-2 rounded">
  </div>
</div>

<hr class="my-6">

{{-- Contactos (arreglos paralelos) --}}
<div class="space-y-4">
  <div class="font-semibold">Contactos</div>

  @php
    $contactosOld = old('contactos');
    $rows = [];

    if ($contactosOld && isset($contactosOld['nombre'])) {
        foreach ($contactosOld['nombre'] as $i => $n) {
            $rows[] = [
              'id' => $contactosOld['id'][$i] ?? null,
              'nombre' => $n,
              'email' => $contactosOld['email'][$i] ?? null,
              'telefono' => $contactosOld['telefono'][$i] ?? null,
            ];
        }
    } else {
        $rows = isset($empresa) ? $empresa->contactos->map(fn($c)=>[
          'id'=>$c->id_contacto,'nombre'=>$c->nombre,'email'=>$c->email,'telefono'=>$c->telefono
        ])->toArray() : [['id'=>null,'nombre'=>'','email'=>'','telefono'=>'']];
    }
  @endphp

  @foreach($rows as $i => $c)
    <div class="grid md:grid-cols-4 gap-3 items-end border p-3 rounded">
      <input type="hidden" name="contactos[id][]" value="{{ $c['id'] }}">
      <div>
        <label class="block text-sm mb-1">Nombre</label>
        <input name="contactos[nombre][]" value="{{ $c['nombre'] }}" class="w-full border px-3 py-2 rounded" required>
      </div>
      <div>
        <label class="block text-sm mb-1">Email</label>
        <input type="email" name="contactos[email][]" value="{{ $c['email'] }}" class="w-full border px-3 py-2 rounded">
      </div>
      <div>
        <label class="block text-sm mb-1">Teléfono</label>
        <input name="contactos[telefono][]" value="{{ $c['telefono'] }}" class="w-full border px-3 py-2 rounded">
      </div>
      {{-- Botón para quitar fila vía recarga (opcional: Alpine para quitar sin recargar) --}}
      <div>
        <a href="javascript:void(0)" onclick="this.closest('.grid').remove()" class="inline-block px-3 py-2 bg-gray-200 rounded">Quitar</a>
      </div>
    </div>
  @endforeach

  {{-- Botón para agregar otra fila (simple, sin JS complejo) --}}
  <div>
    <button name="add_row" value="1" class="px-3 py-2 bg-gray-200 rounded"
            formaction="{{ url()->current() }}" formmethod="GET">
      + Añadir otro contacto
    </button>
  </div>
</div>

<div class="mt-6 flex gap-2">
  <button class="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
  <a href="{{ route('empresas.index') }}" class="px-4 py-2 bg-gray-200 rounded">Cancelar</a>
</div>
