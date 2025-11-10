<?php

namespace App\Http\Controllers;

use App\Models\serviciosactivos;
use Illuminate\Http\Request;

class FacturacionController extends Controller
{
    public function index(Request $request)
    {
        $q = trim($request->get('q'));                // búsqueda por nombre de empresa
        $estado = $request->get('estado');           // Pendiente | Pagado | (vacío = todos)

        $servicios = serviciosactivos::query()
            ->with(['empresa:id_empresa,nombre_comercial'])
            ->when($estado, fn($qq) => $qq->where('estado_actual_pago', $estado))
            ->when($q, function ($qq) use ($q) {
                $qq->whereHas('empresa', function ($e) use ($q) {
                    $e->where('nombre_comercial', 'like', "%{$q}%");
                });
            })
            ->orderBy('fecha_proximo_vencimiento')
            ->paginate(12)
            ->withQueryString();

        return view('facturacion.index', compact('servicios','q','estado'));
    }

    public function marcarPagado(Request $request, serviciosactivos $servicio)
    {
        // Si ya está pagado, no hacemos nada
        if ($servicio->estado_actual_pago === 'Pagado') {
            return back()->with('status', 'Este servicio ya estaba pagado.');
        }

        $servicio->update([
            'estado_actual_pago' => 'Pagado',
        ]);

        return back()->with('status', 'Pago registrado con éxito.');
    }
}
