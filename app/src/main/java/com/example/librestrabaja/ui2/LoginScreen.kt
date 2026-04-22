package com.example.librestrabaja.ui2

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.librestrabaja.data.LoginRequest // Deberás crear este data class
import com.example.librestrabaja.data.RegisterResponse // Reutilizamos el formato de respuesta
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

@Composable
fun LoginScreen(onNavigateToRegister: () -> Unit, onLoginSuccess: (String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val context = LocalContext.current

    // Configuración de Retrofit (Igual que en Register)
    val retrofit = remember {
        Retrofit.Builder()
            .baseUrl("http://192.168.1.70:3000/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    val apiService = remember { retrofit.create(com.example.librestrabaja.data.ApiService::class.java) }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "Libres Trabaja", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)

        Spacer(modifier = Modifier.height(40.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Correo electrónico") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Contraseña") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                val loginData = com.example.librestrabaja.data.LoginRequest(email, password)

                apiService.loginUser(loginData).enqueue(object : retrofit2.Callback<com.example.librestrabaja.data.RegisterResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<com.example.librestrabaja.data.RegisterResponse>,
                        response: retrofit2.Response<com.example.librestrabaja.data.RegisterResponse>
                    ) {
                        if (response.isSuccessful) {
                            Toast.makeText(context, "¡Bienvenido!", Toast.LENGTH_SHORT).show()
                            onLoginSuccess(email) // Navegamos al Feed
                        } else {
                            Toast.makeText(context, "Correo o contraseña incorrectos", Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<com.example.librestrabaja.data.RegisterResponse>, t: Throwable) {
                        Toast.makeText(context, "Error de conexión: ${t.message}", Toast.LENGTH_SHORT).show()
                    }
                })
            },
            modifier = Modifier.fillMaxWidth().height(50.dp)
        ) {
            Text("Iniciar Sesión")
        }

        TextButton(onClick = onNavigateToRegister) {
            Text("¿No tienes cuenta? Regístrate aquí")
        }
    }
}