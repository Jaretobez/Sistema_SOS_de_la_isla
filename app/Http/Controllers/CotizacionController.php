<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CotizacionController extends Controller
{
        public function index()
    {
        return view('cotizaciones.index');
    }
}
