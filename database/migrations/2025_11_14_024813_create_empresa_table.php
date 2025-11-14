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
        Schema::create('empresa', function (Blueprint $table) {
            $table->integer('id_empresa', true);
            $table->string('nombre_comercial');
            $table->string('razon_social');
            $table->string('tipo', 100)->nullable();
            $table->string('direccion', 500)->nullable();
            $table->string('id_ruta', 50)->nullable();
            $table->date('fecha_creacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empresa');
    }
};
