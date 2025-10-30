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
        Schema::create('Cotizacion', function (Blueprint $table) {
            $table->id('id_cotizacion'); // Usamos id_cotizacion por consistencia
            $table->unsignedBigInteger('id_contacto'); // Llave Foránea
            $table->string('forma_de_pago', 100)->nullable();
            $table->decimal('total', 12, 2)->nullable(); // DECIMAL para dinero
            $table->string('estado_cotizacion', 50)->default('Borrador');
            $table->date('fecha_vencimiento')->nullable();
            $table->timestamps();

            // Definición de la Llave Foránea
            $table->foreign('id_contacto')->references('id_contacto')->on('Contacto')->onDelete('restrict');
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