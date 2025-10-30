<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\facturacion;
class FacturacionController extends Controller
{
        public function index()
    {
        return view('facturacion.index');
    }
}
