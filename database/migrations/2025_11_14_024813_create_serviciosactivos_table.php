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
        Schema::create('serviciosactivos', function (Blueprint $table) {
            $table->integer('id_servicio', true);
            $table->integer('id_cotizacion')->index('id_cotizacion');
            $table->integer('id_empresa')->index('id_empresa');
            $table->decimal('monto_mensual', 10);
            $table->string('estado_actual_pago', 50)->nullable()->default('Pendiente');
            $table->date('fecha_proximo_vencimiento')->nullable();
            $table->string('estado_documentacion', 50)->nullable()->default('Pendiente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('serviciosactivos');
    }
};
