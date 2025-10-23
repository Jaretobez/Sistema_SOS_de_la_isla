<?php

namespace App\Http\Controllers;
use App\Models\sistema_sos;
use Illuminate\Http\Request;

class Controller
{
     // Lista todas las empresas en la vista listaEmpresa
    public function index()
    {
        $empresas = sistema_sos::orderBy('FECHA_REGISTRO', 'desc')->get();
        return view('listaEmpresa', compact('empresas'));
    }

    // Buscar empresas por término (GET o POST)
    public function buscar(Request $request)
    {
        $termino = $request->input('busqueda'); // o $request->query('busqueda') para GET
        $empresas = sistema_sos::where('EMPRESA', 'LIKE', "%{$termino}%")
                                ->orWhere('RAZON_SOCIAL', 'LIKE', "%{$termino}%")
                                ->orderBy('FECHA_REGISTRO', 'desc')
                                ->get();

        // Si quieres devolver JSON (AJAX):
        if ($request->wantsJson()) {
            return response()->json($empresas);
        }

        return view('listaEmpresa', compact('empresas'));
    }

    public function indexCotizaciones()
    {
        return view('cotizaciones');
    }

    public function indexFacturacion()
    {
        return view('facturacion');
    }

}
