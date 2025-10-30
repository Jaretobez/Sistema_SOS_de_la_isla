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
        Schema::create('DetalleCotizacion', function (Blueprint $table) {
            $table->id('id_detalle');
            $table->unsignedBigInteger('id_cotizacion'); // Llave Foránea
            $table->unsignedBigInteger('id_producto'); // Llave Foránea
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 10, 2); // DECIMAL para el precio "congelado"
            $table->boolean('lunes')->default(false);
            $table->boolean('martes')->default(false);
            $table->boolean('miercoles')->default(false);
            $table->boolean('jueves')->default(false);
            $table->boolean('viernes')->default(false);
            $table->timestamps();

            // Definición de Llaves Foráneas
            $table->foreign('id_cotizacion')->references('id_cotizacion')->on('Cotizacion')->onDelete('cascade');
            $table->foreign('id_producto')->references('id_producto')->on('Producto')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_cotizacion');
    }
};
