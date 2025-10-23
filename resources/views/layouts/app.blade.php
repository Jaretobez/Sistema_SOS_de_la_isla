<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Panel de Ventas')</title>

    <!-- Fuentes y CSS -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body>

    <header class="header">
        <div class="header-logo">
            <i class="fas fa-chart-line"></i>
            <h1>Sistema de Ventas</h1>
        </div>
        <div class="header-user">
            <i class="fas fa-user-circle"></i>
            <span>@yield('usuario', 'Vendedor')</span>
        </div>
    </header>

    <div class="container">
        <nav class="sidebar">
            <ul>
                <li class="{{ request()->is('/') ? 'active' : '' }}"><a href="/"><i class="fas fa-home"></i><span>Inicio</span></a></li>
                <li class="{{ request()->is('listaEmpresa*') ? 'active' : '' }}"><a href="{{ url('listaEmpresa') }}"><i class="fas fa-address-book"></i> <span>Empresas</span></a></li>
                <li class="{{ request()->is('cotizaciones*') ? 'active' : '' }}"><a href="{{ url('cotizaciones') }}"><i class="fas fa-file-invoice-dollar"></i> <span>Cotizaciónes</span></a></li>
                <li class="{{ request()->is('facturacion*') ? 'active' : '' }}"><a href="{{ url('facturacion') }}"><i class="fas fa-money-bill-wave"></i> <span>Facturación</span></a></li>
            </ul>
        </nav>

        <main class="main-content">
            @yield('content')
        </main>
    </div>

</body>
</html>
