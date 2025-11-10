<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\CotizacionController;
use App\Http\Controllers\FacturacionController;
use App\Http\Controllers\ServiciosactivosController;

Route::get('/', function () {
    return view('auth.login');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');


Route::middleware(['auth','verified'])->group(function () {
    Route::resource('empresas', EmpresaController::class);
});


Route::middleware(['auth','verified'])->group(function () {
Route::get('/empresas', [EmpresaController::class, 'index'])->name('empresas.index');
Route::get('/empresas/{empresa}', [EmpresaController::class, 'show'])->name('empresas.show');
Route::get('/empresas/{empresa}/edit', [EmpresaController::class, 'edit'])->name('empresas.edit');
    // opcional, si vas a cancelar servicio:
    Route::post('servicios/{servicio}/cancelar', [ServiciosactivosController::class,'cancelar'])->name('servicios.cancelar');
});



Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*Route::middleware(['auth','verified'])->group(function () {
    Route::get('/empresas', [App\Http\Controllers\EmpresaController::class, 'index'])
        ->name('empresas.index');
});*/



Route::middleware(['auth','verified'])->group(function () {
    Route::resource('cotizaciones', CotizacionController::class)->except(['show']);

    // Acciones que en tu JS eran "modo":
    Route::post('cotizaciones/{cotizacion}/estado', [CotizacionController::class,'cambiarEstado'])
        ->name('cotizaciones.estado');        // rechazar / mover estado
    Route::post('cotizaciones/{cotizacion}/aceptar', [CotizacionController::class,'aceptar'])
        ->name('cotizaciones.aceptar');      // acepta y crea ServicioActivo
});

Route::middleware(['auth','verified'])->group(function () {
    Route::get('cotizaciones', [CotizacionController::class,'index'])->name('cotizaciones.index');
    Route::get('cotizaciones/create', [CotizacionController::class,'create'])->name('cotizaciones.create');
    Route::post('cotizaciones', [CotizacionController::class,'store'])->name('cotizaciones.store');
    Route::delete('cotizaciones/{cotizacion}', [CotizacionController::class,'destroy'])->name('cotizaciones.destroy');

    Route::post('cotizaciones/{cotizacion}/estado', [CotizacionController::class,'cambiarEstado'])->name('cotizaciones.estado');
    Route::post('cotizaciones/{cotizacion}/aceptar', [CotizacionController::class,'aceptar'])->name('cotizaciones.aceptar');
});

Route::middleware(['auth','verified'])->group(function () {
    Route::get('facturacion', [FacturacionController::class,'index'])->name('facturacion.index');
    Route::post('facturacion/{servicio}/pagar', [FacturacionController::class,'marcarPagado'])->name('facturacion.pagar');
});

//Route::get('/empresas', [EmpresaController::class, 'index'])->name('empresas.index');
//Route::get('/cotizaciones', [CotizacionController::class, 'index'])->name('cotizaciones.index');
//Route::get('/facturacion', [FacturacionController::class, 'index'])->name('facturacion.index');


require __DIR__.'/auth.php';
