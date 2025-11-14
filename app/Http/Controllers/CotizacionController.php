<?php

namespace App\Http\Controllers;

use App\Models\Cotizacion;
use App\Models\Contacto;
use App\Models\detallecotizacion;
use App\Models\Empresa;
use App\Models\Producto;
use App\Models\serviciosactivos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CotizacionController extends Controller
{
public function index(Request $request)
{
    // ====== Pestaña CREAR: buscar clientes ======
    $qCli = trim($request->query('q_cli',''));

    $empresas = Empresa::with(['contactoPrincipal:id_contacto,id_empresa,nombre,email,telefono'])
        ->when($qCli !== '', function ($q) use ($qCli) {
            $q->where(function ($w) use ($qCli) {
                $w->where('nombre_comercial','like',"%{$qCli}%")
                  ->orWhere('razon_social','like',"%{$qCli}%");
            })->orWhereHas('contactos', function ($w) use ($qCli) {
                $w->where('nombre','like',"%{$qCli}%")
                  ->orWhere('email','like',"%{$qCli}%");
            });
        })
        ->orderBy('nombre_comercial')                 // <-- columna de Empresa
        ->paginate(10, ['*'], 'emp_page')             // <-- firma clásica
        ->withQueryString();

    // ====== Pestaña GUARDADAS: filtros ======
    $qCot   = trim($request->query('q_cot',''));
    $estado = $request->query('estado','');

$cotizaciones = Cotizacion::with(['contacto.empresa:id_empresa,nombre_comercial'])
    ->when($qCot !== '', function($q) use ($qCot){
        $q->where('id_cotizacion', (int) $qCot)
          ->orWhereHas('contacto.empresa', function($w) use ($qCot){
              $w->where('nombre_comercial','like',"%{$qCot}%");
          });
    })
    ->when($estado !== '', fn($q)=>$q->where('estado_cotizacion',$estado))
    ->orderByDesc('id_cotizacion')
    ->paginate(10, ['*'], 'cot_page')
    ->withQueryString();


    return view('cotizaciones.index', compact('empresas','cotizaciones','qCli','qCot','estado'));
}


public function create(Request $request)
{
    $empresa = null;
    if ($request->query('id_empresa')) {
        $empresa = Empresa::find($request->query('id_empresa'));
    }

    // Si estabas filtrando solo “renta” y te queda vacío, quítalo por ahora:
    // $productos = Producto::where('unidad','renta')->orderBy('descripcion')->get();
    $productos = Producto::orderBy('descripcion')
        ->get(['id_producto','sku','descripcion','unidad','precio_unitario']);

    return view('cotizaciones.create', compact('empresa','productos'));
}

    public function store(Request $request)
    {
        // El JS construía "cotizacion" y "detalles".
        // Aquí lo haremos desde inputs del formulario (Blade) con arreglos paralelos.
        $data = $request->validate([
            'id_empresa'       => 'required|integer|exists:Empresa,id_empresa',
            'id_contacto'      => 'nullable|integer',
            'forma_de_pago'    => 'nullable|string|max:100',
            'fecha_vencimiento'=> 'nullable|date',
            'estado' => 'nullable|string|in:Pendiente,Aceptada,Rechazada,Borrador',

            'items.id_producto.*'   => 'required|integer|exists:Producto,id_producto',
            'items.cantidad.*'      => 'required|numeric|min:0.01',
            'items.precio_unitario.*'=> 'required|numeric|min:0',

            // campos opcionales del “servicio”:
            'servicio.enable'       => 'nullable|boolean',
            'servicio.id_producto'  => 'nullable|integer|exists:Producto,id_producto',
            'servicio.precio_mensual'=>'nullable|numeric|min:0',
            'servicio.lunes'        => 'nullable|boolean',
            'servicio.martes'       => 'nullable|boolean',
            'servicio.miercoles'    => 'nullable|boolean',
            'servicio.jueves'       => 'nullable|boolean',
            'servicio.viernes'      => 'nullable|boolean',
            'servicio.tipo_residuo' => 'nullable|string|max:50',
            'servicio.bolsas_por_dia'=> 'nullable|numeric|min:0',
            'servicio.peso_por_bolsa_kg'=> 'nullable|numeric|min:0',
        ]);

            $contactoId = $request->input('id_contacto');
    if (!$contactoId) {
        $contactoId = Contacto::where('id_empresa', $request->id_empresa)
                    ->orderBy('id_contacto')->value('id_contacto');
    }

    

        return DB::transaction(function () use ($data) {
            $folio = 'COT-' . now()->format('Ymd') . '-' . Str::upper(Str::random(4));

            $cot = Cotizacion::create([
                'folio'            => $folio,
                'id_empresa'       => $data['id_empresa'],
                'id_contacto'      => $data['id_contacto'] ?? null,
                'forma_de_pago'    => $data['forma_de_pago'] ?? null,
                'estado_cotizacion'=> 'Pendiente',
                'fecha_creacion'   => now()->toDateString(),
                'fecha_vencimiento'=> $data['fecha_vencimiento'] ?? now()->addDays(30)->toDateString(),
                'total'            => 0, // se calcula abajo
            ]);

            $total = 0;

            // Servicio mensual (si viene marcado)
            if (!empty($data['servicio']['enable'])) {
                $det = detallecotizacion::create([
                    'id_cotizacion'    => $cot->id_cotizacion,
                    'id_producto'      => $data['servicio']['id_producto'],
                    'cantidad'         => 1,
                    'precio_unitario'  => $data['servicio']['precio_mensual'] ?? 0,
                    'lunes'            => !empty($data['servicio']['lunes']),
                    'martes'           => !empty($data['servicio']['martes']),
                    'miercoles'        => !empty($data['servicio']['miercoles']),
                    'jueves'           => !empty($data['servicio']['jueves']),
                    'viernes'          => !empty($data['servicio']['viernes']),
                    'tipo_residuo'     => $data['servicio']['tipo_residuo'] ?? null,
                    'bolsas_por_dia'   => $data['servicio']['bolsas_por_dia'] ?? null,
                    'peso_por_bolsa_kg'=> $data['servicio']['peso_por_bolsa_kg'] ?? null,
                ]);
                $total += $det->precio_unitario * 1;
            }

            // Ítems de tolvas/otros
            $ids      = $data['items']['id_producto'] ?? [];
            $cant     = $data['items']['cantidad'] ?? [];
            $precios  = $data['items']['precio_unitario'] ?? [];

            foreach ($ids as $i => $idProd) {
                $det = detallecotizacion::create([
                    'id_cotizacion'   => $cot->id_cotizacion,
                    'id_producto'     => $idProd,
                    'cantidad'        => $cant[$i],
                    'precio_unitario' => $precios[$i],
                ]);
                $total += $det->cantidad * $det->precio_unitario;
            }

            $cot->update(['total' => $total]);

    return redirect()->route('cotizaciones.index')
            ->with('ok','Cotización creada (#'.$cot->id_cotizacion.')');        });
    }

    public function edit(Cotizacion $cotizacion)
    {
        $cotizacion->load('detalles.producto','empresa');
        $productosTolva = Producto::where('unidad','renta')->orderBy('descripcion')->get();
        return view('cotizaciones.edit', compact('cotizacion','productosTolva'));
    }

    public function update(Request $request, Cotizacion $cotizacion)
    {
        // (similar a store, canjeando los arreglos y reseteando detalles)
        $data = $request->validate([
            'id_empresa'       => 'required|integer|exists:Empresa,id_empresa',
            'id_contacto'      => 'nullable|integer',
            'forma_de_pago'    => 'nullable|string|max:100',
            'fecha_vencimiento'=> 'nullable|date',

            'items.id_producto.*'   => 'required|integer|exists:Producto,id_producto',
            'items.cantidad.*'      => 'required|numeric|min:0.01',
            'items.precio_unitario.*'=> 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($cotizacion,$data) {
            $cotizacion->update([
                'id_empresa'       => $data['id_empresa'],
                'id_contacto'      => $data['id_contacto'] ?? null,
                'forma_de_pago'    => $data['forma_de_pago'] ?? null,
                'fecha_vencimiento'=> $data['fecha_vencimiento'] ?? $cotizacion->fecha_vencimiento,
            ]);

            // reset de detalles simples (si quieres sincronización fina, me dices)
            $cotizacion->detalles()->delete();

            $total = 0;
            $ids      = $data['items']['id_producto'] ?? [];
            $cant     = $data['items']['cantidad'] ?? [];
            $precios  = $data['items']['precio_unitario'] ?? [];

            foreach ($ids as $i => $idProd) {
                $det = detallecotizacion::create([
                    'id_cotizacion'   => $cotizacion->id_cotizacion,
                    'id_producto'     => $idProd,
                    'cantidad'        => $cant[$i],
                    'precio_unitario' => $precios[$i],
                ]);
                $total += $det->cantidad * $det->precio_unitario;
            }

            $cotizacion->update(['total'=>$total]);

            return redirect()->route('cotizaciones.index')->with('ok','Cotización actualizada');
        });
    }

    public function destroy(Cotizacion $cotizacion)
    {
        $cotizacion->detalles()->delete();
        $cotizacion->delete();
        return redirect()->route('cotizaciones.index')->with('ok','Cotización eliminada');
    }

    // ====== Acciones que mapean tus "modos" del JS ======
    public function cambiarEstado(Request $request, Cotizacion $cotizacion)
    {
        $request->validate(['estado'=>'required|in:Pendiente,Aceptada,Rechazada']);
        $cotizacion->update(['estado_cotizacion'=>$request->estado]);
        return back()->with('ok','Estado actualizado a '.$request->estado);
    }

    public function aceptar(Request $request, Cotizacion $cotizacion)
    {
        // Acepta la cotización y crea ServicioActivo
        return DB::transaction(function () use ($cotizacion) {
            $cotizacion->update(['estado_cotizacion'=>'Aceptada']);

            // monto mensual: si tienes un detalle de servicio, úsalo; si no, usa total
            $monto = $cotizacion->detalles()->whereNotNull('tipo_residuo')->first()->precio_unitario
                ?? $cotizacion->total;

            serviciosactivos::create([
                'id_empresa'   => $cotizacion->id_empresa,
                'id_cotizacion'=> $cotizacion->id_cotizacion,
                'monto_mensual'=> $monto,
                'estado'       => 'Activo',
                'fecha_inicio' => now()->toDateString(),
            ]);

            return back()->with('ok','Cotización aceptada y servicio creado');
        });
    }
}

