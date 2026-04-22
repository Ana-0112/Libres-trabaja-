package com.example.librestrabaja.ui2

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import com.example.librestrabaja.MainActivity

class LoginActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // En lugar de cargar una pantalla aquí, saltamos a MainActivity
        // que ya tiene configurado el Login, Registro y Feed.
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish() // Cerramos esta actividad para que no estorbe
    }
}