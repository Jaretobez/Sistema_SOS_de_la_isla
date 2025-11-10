<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmpresaRequest;
use App\Models\Empresa;
use App\Models\Contacto;
use Illuminate\Http\Request;           
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\View\View;

class EmpresaController extends Controller
{
     public function show(Empresa $empresa)
    {
        // contactos y último servicio (si existe)
        $empresa->load(['contactos', 'serviciosActivos' => function ($q) {
            $q->orderByDesc('fecha_proximo_vencimiento');
        }]);

        $servicio = $empresa->serviciosActivos->first(); // último servicio (o null)

        // Intentamos armar horario desde el detalle de la cotización asociada
        $horario = null;
        if ($servicio && $servicio->id_cotizacion) {
            $det = DB::table('DetalleCotizacion')
                ->where('id_cotizacion', $servicio->id_cotizacion)
                ->orderBy('id_producto') // cualquiera; buscamos una línea con flags de días
                ->first();

            if ($det) {
                $horario = [
                    'lunes'     => (bool)($det->lunes ?? 0),
                    'martes'    => (bool)($det->martes ?? 0),
                    'miercoles' => (bool)($det->miercoles ?? 0),
                    'jueves'    => (bool)($det->jueves ?? 0),
                    'viernes'   => (bool)($det->viernes ?? 0),
                ];
            }
        }

        return view('empresas.show', compact('empresa', 'servicio', 'horario'));
    }

     public function index()
    {
        // Aquí pedimos las empresas con su contacto principal
        $empresas = Empresa::with(['contactoPrincipal'])
            ->orderBy('nombre_comercial')
            ->get();

        // Enviamos la variable $empresas a la vista
        return view('empresas.index', compact('empresas'));
    }

    public function create()
    {
        return view('empresas.create');
    }

    public function store(EmpresaRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function() use ($data) {
            $empresa = Empresa::create([
                'nombre_comercial' => $data['nombre_comercial'],
                'razon_social'     => $data['razon_social'] ?? null,
                'tipo'             => $data['tipo'] ?? null,
                'direccion'        => $data['direccion'] ?? null,
                'id_ruta'          => $data['id_ruta'] ?? null,
                'fecha_creacion'   => $data['fecha_creacion'] ?? null,
            ]);

            // Contactos (primer contacto será “principal” por orden)
            $nombres   = $data['contactos']['nombre']   ?? [];
            $emails    = $data['contactos']['email']    ?? [];
            $telefonos = $data['contactos']['telefono'] ?? [];

            foreach ($nombres as $i => $nombre) {
                $empresa->contactos()->create([
                    'nombre'   => $nombre,
                    'email'    => $emails[$i]    ?? null,
                    'telefono' => $telefonos[$i] ?? null,
                ]);
            }
        });

        return redirect()->route('empresas.index')->with('ok','Empresa creada');
    }

    public function edit(Empresa $empresa)
    {
        $empresa->load('contactos');
        return view('empresas.edit', compact('empresa'));
    }

    public function update(EmpresaRequest $request, Empresa $empresa)
    {
        $data = $request->validated();

        DB::transaction(function() use ($empresa, $data) {
            $empresa->update([
                'nombre_comercial' => $data['nombre_comercial'],
                'razon_social'     => $data['razon_social'] ?? null,
                'tipo'             => $data['tipo'] ?? null,
                'direccion'        => $data['direccion'] ?? null,
                'id_ruta'          => $data['id_ruta'] ?? null,
                'fecha_creacion'   => $data['fecha_creacion'] ?? null,
            ]);

            // Sincronizar contactos por arreglos paralelos
            $ids       = $data['contactos']['id']       ?? [];
            $nombres   = $data['contactos']['nombre']   ?? [];
            $emails    = $data['contactos']['email']    ?? [];
            $telefonos = $data['contactos']['telefono'] ?? [];

            $idsVivos = [];

            foreach ($nombres as $i => $nombre) {
                $id = $ids[$i] ?? null;

                if ($id) {
                    $c = $empresa->contactos()->where('id_contacto',$id)->first();
                    if ($c) {
                        $c->update([
                            'nombre'   => $nombre,
                            'email'    => $emails[$i]    ?? null,
                            'telefono' => $telefonos[$i] ?? null,
                        ]);
                        $idsVivos[] = $c->id_contacto;
                    }
                } else {
                    $nuevo = $empresa->contactos()->create([
                        'nombre'   => $nombre,
                        'email'    => $emails[$i]    ?? null,
                        'telefono' => $telefonos[$i] ?? null,
                    ]);
                    $idsVivos[] = $nuevo->id_contacto;
                }
            }

            // borra los que ya no vienen
            $empresa->contactos()->whereNotIn('id_contacto', $idsVivos)->delete();
        });

        return redirect()->route('empresas.index')->with('ok','Empresa actualizada');
    }

    public function destroy(Empresa $empresa)
    {
        $empresa->delete();
        return redirect()->route('empresas.index')->with('ok','Empresa eliminada');
    }
}
