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
        Schema::create('detallecotizacion', function (Blueprint $table) {
            $table->integer('id_detalle', true);
            $table->integer('id_cotizacion')->index('id_cotizacion');
            $table->integer('id_producto')->index('id_producto');
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 10);
            $table->boolean('lunes')->nullable()->default(false);
            $table->boolean('martes')->nullable()->default(false);
            $table->boolean('miercoles')->nullable()->default(false);
            $table->boolean('jueves')->nullable()->default(false);
            $table->boolean('viernes')->nullable()->default(false);
            $table->string('tipo_residuo', 100)->nullable();
            $table->integer('bolsas_por_dia')->nullable();
            $table->decimal('peso_por_bolsa_kg', 10)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detallecotizacion');
    }
};
