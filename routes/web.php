<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Controller;


Route::get('/', function () {
    return view('inicio');
});

Route::get('/listaEmpresa', [Controller::class, 'index'])->name('empresas.index');
Route::get('/listaEmpresa/buscar', [Controller::class, 'buscar'])->name('empresas.buscar');
// O si prefieres POST para búsquedas:
Route::post('/listaEmpresa/buscar', [Controller::class, 'buscar'])->name('empresas.buscar.post');
Route::get('/cotizaciones', [Controller::class, 'indexCotizaciones']);
Route::get('/facturacion', [Controller::class, 'indexFacturacion']);