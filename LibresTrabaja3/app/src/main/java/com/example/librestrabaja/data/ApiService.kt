package com.example.librestrabaja.data

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

// Borramos UserRequest de aquí porque ya usamos RegisterRequest en su propio archivo

interface ApiService {
    // Esta ruta debe coincidir con tu backend en Render
    @POST("api/register")
    fun registerUser(@Body request: RegisterRequest): Call<RegisterResponse>

    @POST("api/login")
    fun loginUser(@Body request: LoginRequest): Call<RegisterResponse>
}