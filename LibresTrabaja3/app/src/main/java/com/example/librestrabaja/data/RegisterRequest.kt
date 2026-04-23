package com.example.librestrabaja.data

data class RegisterRequest(
    val nombres: String,
    val apellidos: String,
    val email: String,
    val telefono: String,
    val password: String,
    val role: String,
    val nombreEmpresa: String? = null,
    val ubicacion: String? = null
)

data class RegisterResponse(
    val message: String,
    val success: Boolean
)