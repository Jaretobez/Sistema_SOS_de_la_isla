@extends('layouts.barmenu')
@section('usuario', auth()->user()->name ?? 'Vendedor')

@section('content')

@endsection