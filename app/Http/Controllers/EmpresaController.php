<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
        public function index()
    {

        // Llamamos a la función del modelo
        $empresas = Empresa::obtenerEmpresas();

        // Retornamos la vista existente con los datos
        return view('empresas.index', compact('empresas'));
    }
}