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
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @vite(['resources/css/style.css', 'resources/js/empresas.js'])


</head>
<body>
       <header class="header">

        <div class="header-logo">
            <i class="fas fa-chart-line"></i>
            <h1>Sistema de Ventas</h1>
        </div>


        <div class="header-user">
            <i class="fas fa-user-circle"></i>

                        <!-- Settings Dropdown -->
          <div class="flex items-center ms-6">

                <x-dropdown align="right" width="48">
                    <x-slot name="trigger">
                        <button class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150">
                            <div>{{ Auth::user()->name }}</div>

                            <div class="ms-1">
                                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        </button>
                    </x-slot>

                    <x-slot name="content">
                        <x-dropdown-link :href="route('profile.edit')">
                            {{ __('Profile') }}
                        </x-dropdown-link>

                        <!-- Authentication -->
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf

                            <x-dropdown-link :href="route('logout')"
                                    onclick="event.preventDefault();
                                                this.closest('form').submit();">
                                {{ __('Log Out') }}
                            </x-dropdown-link>
                        </form>
                    </x-slot>
                </x-dropdown>
            </div>

        </div>
    </header>

    <div class="container">
        <nav class="sidebar">

            <!-- Menú de la sidebar (adaptado con clases 'active' y tus rutas) -->
            <ul class="sidebar-menu">
                <li class="{{ request()->is('dashboard') ? 'active' : '' }}">
                    <a href="{{ url('dashboard') }}">
                        <i class="fas fa-home"></i> <span>Dashboard</span>
                    </a>
                </li>

                <li class="{{ request()->is('empresas*') ? 'active' : '' }}">
                    <a href="{{ url('empresas') }}">
                        <i class="fas fa-address-book"></i> <span>Empresas</span>
                    </a>
                </li>

                <li class="{{ request()->is('cotizaciones*') ? 'active' : '' }}">
                    <a href="{{ url('cotizaciones') }}">
                        <i class="fas fa-file-invoice-dollar"></i> <span>Cotizaciones</span>
                    </a>
                </li>

                <li class="{{ request()->is('facturacion*') ? 'active' : '' }}">
                    <a href="{{ url('facturacion') }}">
                        <i class="fas fa-money-bill-wave"></i> <span>Facturación</span>
                    </a>
                </li>

                <!-- Item extra del snippet: Documentación -->
                <li class="{{ request()->is('documentacion*') ? 'active' : '' }}">
                    <a href="{{ url('documentacion') }}">
                        <i class="fas fa-book"></i> <span>Documentación</span>
                    </a>
                </li>
            </ul>
        </nav>

        <main class="main-content">
            @yield('content')
        </main>
    </div>
</body>
</html>
