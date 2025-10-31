<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

         // Nombre de la tabla
    protected $table = 'empresas';

    // Clave primaria personalizada
    protected $primaryKey = 'id_empresa';
    /**
     * Run the migrations.
     */
   public function up(): void
    {
        Schema::create('empresas', function (Blueprint $table) {
            $table->id('id_empresa');
            $table->string('nombre_empresa');
            $table->string('razon_social');
            $table->string('tipo')->nullable();
            $table->string('direccion')->nullable();
            $table->enum('estado', ['Activo', 'Suspendido', 'Cancelado'])->nullable();
            $table->string('horario')->nullable();
            $table->string('ruta')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};
