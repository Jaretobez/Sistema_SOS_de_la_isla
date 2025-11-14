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
        Schema::create('cotizacion', function (Blueprint $table) {
            $table->integer('id_cotizacion', true);
            $table->integer('id_contacto')->index('id_contacto');
            $table->string('forma_de_pago', 100)->nullable();
            $table->decimal('total', 12)->nullable();
            $table->string('estado_cotizacion', 50)->nullable()->default('Borrador');
            $table->date('fecha_vencimiento')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cotizacion');
    }
};
