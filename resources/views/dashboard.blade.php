@extends('layouts.app')

@section('title', 'Dashboard de Ventas')
@section('usuario', auth()->user()->name ?? 'Vendedor')

@section('content')

    <div class="dashboard-header">
        <h2>Dashboard de Ventas</h2>
        <button class="add-button"><i class="fas fa-plus"></i> Añadir Contacto</button>
    </div>

    <section class="cards-section">
        <div class="card">
            <div class="card-icon"><i class="fas fa-hourglass-half"></i></div>
            <div class="card-content">
                <h3>Cotizaciones Pendientes</h3>
                <p class="card-number">15</p>
            </div>
        </div>
        <div class="card">
            <div class="card-icon"><i class="fas fa-users"></i></div>
            <div class="card-content">
                <h3>Clientes Activos</h3>
                <p class="card-number">85</p>
            </div>
        </div>
        <div class="card">
            <div class="card-icon"><i class="fas fa-ban"></i></div>
            <div class="card-content">
                <h3>Clientes Suspendidos</h3>
                <p class="card-number">7</p>
            </div>
        </div>
    </section>

    <section class="recent-quotes-section">
        <h3>Cotizaciones Recientes</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Contacto</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>#12345</td>
                    <td>Empresa ABC</td>
                    <td>20/10/2025</td>
                    <td>$1,250</td>
                    <td class="status-pending">Pendiente</td>
                </tr>
                <tr>
                    <td>#12344</td>
                    <td>Cliente XZ</td>
                    <td>18/10/2025</td>
                    <td>$5,400</td>
                    <td class="status-accepted">Aceptada</td>
                </tr>
                <tr>
                    <td>#12343</td>
                    <td>Comercial JKL</td>
                    <td>15/10/2025</td>
                    <td>$2,100</td>
                    <td class="status-pending">Pendiente</td>
                </tr>
            </tbody>
        </table>
    </section>
@endsection
