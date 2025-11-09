<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\CotizacionController;
use App\Http\Controllers\FacturacionController;

Route::get('/', function () {
    return view('auth.login');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');


Route::middleware(['auth','verified'])->group(function () {
    Route::resource('empresas', EmpresaController::class);
});


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth','verified'])->group(function () {
    Route::get('/empresas', [App\Http\Controllers\EmpresaController::class, 'index'])
        ->name('empresas.index');
});


Route::get('/empresas', [EmpresaController::class, 'index'])->name('empresas.index');
Route::get('/cotizaciones', [CotizacionController::class, 'index'])->name('cotizaciones.index');
//Route::get('/facturacion', [FacturacionController::class, 'index'])->name('facturacion.index');


require __DIR__.'/auth.php';
