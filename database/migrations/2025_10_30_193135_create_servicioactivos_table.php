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
        Schema::create('ServiciosActivos', function (Blueprint $table) {
            $table->id('id_servicio');
            $table->unsignedBigInteger('id_cotizacion'); // Llave Foránea
            $table->unsignedBigInteger('id_empresa'); // Llave Foránea
            $table->decimal('monto_mensual', 10, 2); // DECIMAL para dinero
            $table->string('estado_actual_pago', 50)->default('Pendiente');
            $table->date('fecha_proximo_vencimiento')->nullable();
            $table->string('estado_documentacion', 50)->default('Pendiente');
            $table->timestamps();

            // Definición de Llaves Foráneas
            $table->foreign('id_cotizacion')->references('id_cotizacion')->on('Cotizacion')->onDelete('restrict');
            $table->foreign('id_empresa')->references('id_empresa')->on('Empresa')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servicios_activos');
    }
};
