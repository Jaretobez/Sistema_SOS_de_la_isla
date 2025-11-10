@extends('layouts.app')
@section('title','Crear Cotización')

@section('content')
<div 
  x-data="cotizacionForm({


  })"
  class="space-y-6"
>
  <h2 class="text-lg font-semibold">Crear Cotización</h2>

  @if($errors->any())
    <div class="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
      <ul class="list-disc pl-5">
        @foreach($errors->all() as $e)<li>{{ $e }}</li>@endforeach
      </ul>
    </div>
  @endif

  <form method="POST" action="{{ route('cotizaciones.store') }}" class="space-y-6">
    @csrf

    {{-- ======= Cliente / Empresa ======= --}}
    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm mb-1">Cliente (Empresa)</label>
        @if(!empty($empresa))
          <input type="hidden" name="id_empresa" value="{{ $empresa->id_empresa }}">
          <input class="w-full border rounded px-3 py-2 bg-gray-50" value="{{ $empresa->nombre_comercial }}" readonly>
        @else
          <select name="id_empresa" class="w-full border rounded px-3 py-2" required>
            <option value="">-- Selecciona --</option>
            @foreach(\App\Models\Empresa::orderBy('nombre_comercial')->get(['id_empresa','nombre_comercial']) as $e)
              <option value="{{ $e->id_empresa }}">{{ $e->nombre_comercial }}</option>
            @endforeach
          </select>
        @endif
      </div>

      <div>
        <label class="block text-sm mb-1">Contacto (opcional)</label>
        {{-- Si quieres precargar el contacto principal, puedes poner el ID aquí --}}
        <input type="number" name="id_contacto" class="w-full border rounded px-3 py-2" placeholder="ID de contacto (opcional)">
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm mb-1">Forma de pago (opcional)</label>
        <input type="text" name="forma_de_pago" class="w-full border rounded px-3 py-2" placeholder="Transferencia / Efectivo / 30 días...">
      </div>
      <div>
        <label class="block text-sm mb-1">Vence el</label>
        <input type="date" name="fecha_vencimiento" class="w-full border rounded px-3 py-2" value="{{ now()->addDays(30)->toDateString() }}">
      </div>
      <div class="flex items-end">
        {{-- Total calculado (solo lectura) + hidden para enviar --}}
        <div class="w-full">
          <label class="block text-sm mb-1">Total estimado</label>
          <input x-model="fmtTotal" class="w-full border rounded px-3 py-2 bg-gray-50" readonly>
          <input type="hidden" name="total" x-model="total">
        </div>
      </div>
    </div>

    {{-- ======= Servicio mensual (recolección) opcional ======= --}}
    <div class="border rounded p-4 space-y-4">
      <div class="flex items-center gap-3">
        <input id="srv-enable" type="checkbox" x-model="srv.enable" class="h-4 w-4">
        <label for="srv-enable" class="font-semibold">Incluir servicio mensual de recolección</label>
      </div>

      <div x-show="srv.enable" x-transition class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Producto / Servicio</label>
          <select name="servicio[id_producto]" class="w-full border rounded px-3 py-2" x-model="srv.id_producto">
            <template x-if="productoServicioId">
              <option :value="productoServicioId">Servicio mensual</option>
            </template>
            {{-- Si prefieres elegir desde catálogo, habilita esto:--}}
            <template x-for="p in productosTolva" :key="p.id_producto">
              <option :value="p.id_producto" x-text="`${p.descripcion}`"></option>
            </template>
            
          </select>
        </div>

        <div>
          <label class="block text-sm mb-1">Precio mensual</label>
          <input type="number" step="0.01" class="w-full border rounded px-3 py-2"
                 name="servicio[precio_mensual]" x-model.number="srv.precio_mensual" @input="recalcular()">
        </div>

        <div class="md:col-span-2">
          <div class="font-medium mb-1">Días de recolección</div>
          <div class="flex flex-wrap gap-4">
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" class="h-4 w-4" x-model="srv.dias.lunes"> Lunes
              <input type="hidden" name="servicio[lunes]" :value="srv.dias.lunes ? 1 : 0">
            </label>
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" class="h-4 w-4" x-model="srv.dias.martes"> Martes
              <input type="hidden" name="servicio[martes]" :value="srv.dias.martes ? 1 : 0">
            </label>
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" class="h-4 w-4" x-model="srv.dias.miercoles"> Miércoles
              <input type="hidden" name="servicio[miercoles]" :value="srv.dias.miercoles ? 1 : 0">
            </label>
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" class="h-4 w-4" x-model="srv.dias.jueves"> Jueves
              <input type="hidden" name="servicio[jueves]" :value="srv.dias.jueves ? 1 : 0">
            </label>
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" class="h-4 w-4" x-model="srv.dias.viernes"> Viernes
              <input type="hidden" name="servicio[viernes]" :value="srv.dias.viernes ? 1 : 0">
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm mb-1">Tipo de residuo</label>
          <select name="servicio[tipo_residuo]" class="w-full border rounded px-3 py-2" x-model="srv.tipo_residuo">
            <option value="Urbano">Urbano</option>
            <option value="Especial">Especial</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm mb-1">Bolsas por día</label>
            <input type="number" step="1" min="0" class="w-full border rounded px-3 py-2"
                   name="servicio[bolsas_por_dia]" x-model.number="srv.bolsas_por_dia" @input="recalcular()">
          </div>
          <div>
            <label class="block text-sm mb-1">Peso por bolsa (kg)</label>
            <input type="number" step="0.01" min="0" class="w-full border rounded px-3 py-2"
                   name="servicio[peso_por_bolsa_kg]" x-model.number="srv.peso_por_bolsa_kg" @input="recalcular()">
          </div>
        </div>

        {{-- Campos hidden para habilitar/estado del servicio --}}
        <input type="hidden" name="servicio[enable]" :value="srv.enable ? 1 : 0">
      </div>
    </div>

    {{-- ======= Ítems / Tolvas ======= --}}
    <div class="border rounded p-4 space-y-4">
      <div class="flex items-center justify-between">
        <div class="font-semibold">Productos / Tolvas</div>
        <button type="button" class="px-3 py-2 bg-gray-800 text-white rounded"
                @click="addItem()">+ Agregar línea</button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left p-2">Producto</th>
              <th class="text-left p-2 w-28">Cantidad</th>
              <th class="text-left p-2 w-36">Precio unitario</th>
              <th class="text-left p-2 w-36">Subtotal</th>
              <th class="p-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            <template x-for="(row, i) in items" :key="row.key">
              <tr class="border-t">
                <td class="p-2">
<div class="mt-4">
  <label class="block text-sm mb-1">Producto</label>
  <select name="lineas[0][id_producto]" class="border px-3 py-2 rounded w-full" required>
    <option value="">-- Selecciona --</option>
    @forelse($productos as $p)
      <option value="{{ $p->id_producto }}">
        {{ $p->sku }} — {{ $p->descripcion }}
        @if(!is_null($p->precio_unitario)) ({{ number_format($p->precio_unitario, 2) }}) @endif
        @if($p->unidad) [{{ $p->unidad }}] @endif
      </option>
    @empty
      <option value="">No hay productos</option>
    @endforelse
  </select>
</div>
                </td>
                <td class="p-2">
                  <input type="number" step="1" min="1" class="w-full border rounded px-2 py-1"
                         :name="`items[cantidad][]`"
                         x-model.number="row.cantidad" @input="recalcular()">
                </td>
                <td class="p-2">
                  <input type="number" step="0.01" min="0" class="w-full border rounded px-2 py-1"
                         :name="`items[precio_unitario][]`"
                         x-model.number="row.precio_unitario" @input="recalcular()">
                </td>
                <td class="p-2">
                  <input class="w-full border rounded px-2 py-1 bg-gray-50" :value="fmt(row.cantidad * row.precio_unitario)" readonly>
                </td>
                <td class="p-2 text-right">
                  <button type="button" class="px-2 py-1 bg-red-600 text-white rounded" @click="removeItem(i)">Quitar</button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    {{-- ======= Acciones ======= --}}
    <div class="flex gap-2">
      <button class="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
      <a href="{{ route('cotizaciones.index') }}" class="px-4 py-2 bg-gray-200 rounded">Cancelar</a>
    </div>
  </form>
</div>

{{-- ======= Alpine helpers ======= --}}
<script>
  function cotizacionForm({ productosTolva, productoServicioId, precioServicioSugerido, costoPorKg }) {
    return {
      productosTolva,
      productoServicioId,
      costoPorKg,
      // Servicio mensual
      srv: {
        enable: false,
        id_producto: productoServicioId ?? null,
        precio_mensual: precioServicioSugerido ?? 0,
        dias: { lunes:false, martes:false, miercoles:false, jueves:false, viernes:false },
        tipo_residuo: 'Urbano',
        bolsas_por_dia: 0,
        peso_por_bolsa_kg: 0,
      },
      // Items (líneas)
      items: [],
      // Total numérico
      total: 0,
      get fmtTotal(){ return this.fmt(this.total); },

      init(){
        // arranca con una línea vacía
        this.addItem();
        this.recalcular();
      },

      addItem(){
        this.items.push({
          key: crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random(),
          id_producto: '',
          cantidad: 1,
          precio_unitario: 0
        });
      },
      removeItem(i){
        this.items.splice(i,1);
        if (this.items.length === 0) this.addItem();
        this.recalcular();
      },
      syncPrecio(i){
        const row = this.items[i];
        const p = this.productosTolva.find(pp => Number(pp.id_producto) === Number(row.id_producto));
        if (p) row.precio_unitario = Number(p.precio_unitario || 0);
        this.recalcular();
      },

      // cálculo total (servicio + items)
      recalcular(){
        let t = 0;

        // Servicio mensual
        if (this.srv.enable) {
          // costo mensual base
          t += Number(this.srv.precio_mensual || 0);

          // costo extra por peso estimado (bolsas/día * días * 4 semanas * peso * costoPorKg)
          const diasSel = Object.values(this.srv.dias).filter(Boolean).length;
          const bolsasMes = (Number(this.srv.bolsas_por_dia||0) * diasSel) * 4;
          const pesoMes = bolsasMes * Number(this.srv.peso_por_bolsa_kg||0);
          t += pesoMes * Number(this.costoPorKg || 0);
        }

        // Ítems
        this.items.forEach(r => t += Number(r.cantidad||0) * Number(r.precio_unitario||0));

        this.total = Number(t.toFixed(2));
      },

      fmt(n){ return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n||0)); },
    }
  }
</script>
@endsection
