<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
        public function index()
    {
        // Retorna la vista de empresas (crea el archivo si no existe)
        return view('empresas.index');
    }
}
