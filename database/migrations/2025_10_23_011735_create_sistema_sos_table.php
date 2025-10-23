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
        // =========================
        // EMPRESA
        // =========================
        Schema::create('empresa', function (Blueprint $table) {
            $table->increments('ID_EMPRESA');
            $table->string('EMPRESA', 150);
            $table->string('RAZON_SOCIAL', 200)->nullable();
            $table->dateTime('FECHA_REGISTRO')->useCurrent();
        });

        // =========================
        // CONTACTO
        // =========================
        Schema::create('contacto', function (Blueprint $table) {
            $table->increments('ID_CONTACTO');
            $table->integer('ID_EMPRESA')->unsigned();
            $table->string('TELEFONO', 50)->nullable();
            $table->string('NOMBRE', 150)->nullable();
            $table->string('CORREO', 150)->nullable();
            $table->dateTime('FECHA_REGISTRO')->useCurrent();

            $table->foreign('ID_EMPRESA')
                ->references('ID_EMPRESA')->on('empresa')
                ->cascadeOnDelete()->cascadeOnUpdate();
        });

        // =========================
        // COTIZACIONES
        // =========================
        Schema::create('cotizaciones', function (Blueprint $table) {
            $table->increments('ID_COTIZACIONES');
            $table->integer('ID_CONTACTO')->unsigned();
            $table->string('TIPO_SERVICIO', 100)->nullable();
            $table->string('HORARIO', 100)->nullable();
            $table->decimal('PESO', 10, 2)->nullable();
            $table->string('SERVICIO', 150)->nullable();
            $table->decimal('PRECIOCOSTO_SERVICIO', 10, 2)->nullable();
            $table->string('PERIODO_PAGO', 100)->nullable();
            $table->string('FORMA_PAGO', 100)->nullable();
            $table->dateTime('FECHA_COTIZACION')->useCurrent();

            $table->foreign('ID_CONTACTO')
                ->references('ID_CONTACTO')->on('contacto')
                ->restrictOnDelete()->cascadeOnUpdate();
        });

        // =========================
        // DOCUMENTOS
        // =========================
        Schema::create('documentos', function (Blueprint $table) {
            $table->increments('ID_DOCUMENTO');
            $table->integer('ID_EMPRESA')->unsigned();
            $table->string('DOCUMENTO', 255);
            $table->string('TIPO_DOCUMENTO', 100);
            $table->string('ESTATUS', 50);
            $table->dateTime('FECHA_REGISTRO')->useCurrent();

            $table->foreign('ID_EMPRESA')
                ->references('ID_EMPRESA')->on('empresa')
                ->cascadeOnDelete()->cascadeOnUpdate();
        });

        // =========================
        // ESTATUS
        // =========================
        Schema::create('estatus', function (Blueprint $table) {
            $table->increments('ID_ESTATUS');
            $table->string('NOMBRE_ESTATUS', 100);
            $table->dateTime('FECHA_REGISTRO')->useCurrent();
        });

        // =========================
        // HORARIO
        // =========================
        Schema::create('horario', function (Blueprint $table) {
            $table->increments('ID_HORARIO');
            $table->string('HORARIO', 100);
            $table->string('DESCRIPCION', 255)->nullable();
            $table->dateTime('FECHA_REGISTRO')->useCurrent();
        });

        // =========================
        // PAGOS
        // =========================
        Schema::create('pagos', function (Blueprint $table) {
            $table->increments('ID_PAGOS');
            $table->integer('ID_TIPO_SERVICIOS')->unsigned();
            $table->decimal('MONTO', 10, 2)->nullable();
            $table->string('IMG_PAGO', 50)->nullable();
        });

        // =========================
        // PERFIL
        // =========================
        Schema::create('perfil', function (Blueprint $table) {
            $table->increments('ID_PERFIL');
            $table->integer('ID_EMPRESA')->unsigned();
            $table->integer('ID_ESTATUS')->unsigned();
            $table->dateTime('FECHA_REGISTRO')->useCurrent();

            $table->foreign('ID_EMPRESA')
                ->references('ID_EMPRESA')->on('empresa')
                ->cascadeOnDelete()->cascadeOnUpdate();

            $table->foreign('ID_ESTATUS')
                ->references('ID_ESTATUS')->on('estatus')
                ->restrictOnDelete()->cascadeOnUpdate();
        });

        // =========================
        // PERIODO_PAGO
        // =========================
        Schema::create('periodo_pago', function (Blueprint $table) {
            $table->increments('ID_PERIODOPAGO');
            $table->string('NOMBRE_PERIODO', 100);
            $table->dateTime('FECHA_REGISTRO')->useCurrent();
        });

        // =========================
        // TIPO_SERVICIO
        // =========================
        Schema::create('tipo_servicio', function (Blueprint $table) {
            $table->increments('ID_TIPO_SERVICIO');
            $table->string('NOMBRE_SERVICIO', 100);
            $table->dateTime('FECHA_REGISTRO')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sistema_sos');
        Schema::dropIfExists('tipo_servicio');
        Schema::dropIfExists('periodo_pago');
        Schema::dropIfExists('perfil');
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('horario');
        Schema::dropIfExists('estatus');
        Schema::dropIfExists('documentos');
        Schema::dropIfExists('cotizaciones');
        Schema::dropIfExists('contacto');
        Schema::dropIfExists('empresa');
    }
};
