package com.example.librestrabaja.data


data class Company(
    val id: String = "",
    val ownerId: String = "", // ID del usuario que la creó
    val name: String = "",
    val location: String = "",
    val description: String = "",
    val contactPhone: String = "",
    val imageUrls: List<String> = emptyList(), // Lista de rutas de fotos
    val vacanciesIds: List<String> = emptyList()
)