package com.example.librestrabaja.data

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

// Definimos los modelos de datos que usará la interfaz
// En data/ApiService.kt
data class UserRequest(
    val nombre: String,
    val apellidos: String,
    val email: String,
    val telefono: String,
    val rol: String,
    val nombreEmpresa: String? = null,
    val ubicacion: String? = null,
    val password: String
)

data class RegisterResponse(
    val message: String
)

interface ApiService {
    @POST("api/register")
    fun registerUser(@Body request: UserRequest): Call<RegisterResponse>

    @POST("api/login")
    fun loginUser(@Body request: LoginRequest): Call<RegisterResponse>
}