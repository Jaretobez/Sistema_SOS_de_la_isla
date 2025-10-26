@extends('layouts.inicio_layout')
@section('usuario', auth()->user()->name ?? 'Vendedor')

@section('content')

@endsection