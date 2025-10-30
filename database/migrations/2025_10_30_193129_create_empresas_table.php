<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('Empresas', function (Blueprint $table) {
            $table->id('id_empresa');
            $table->string('nombre_comercial', 255);
            $table->string('razon_social', 255);
            $table->string('tipo', 100)->nullable();
            $table->string('direccion', 500)->nullable();
            $table->string('id_ruta', 50)->nullable();
            $table->date('fecha_registro')->nullable();
            $table->timestamps(); // Añade created_at y updated_at
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
