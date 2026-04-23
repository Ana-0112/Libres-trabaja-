package com.example.librestrabaja.data

data class User(
    val id: String = "",
    val nombre: String = "",
    val apellidos: String = "",
    val email: String = "",
    val telefono: String = "",
    val rol: String = "", // "Candidato" o "Reclutador"
    val nombreEmpresa: String? = null,
    val ubicacion: String? = null,
    val password: String
)


