package com.example.librestrabaja.ui2

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.librestrabaja.R // Asegúrate de tener tu imagen en res/drawable
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(onNavigateToRegister: () -> Unit, onLoginSuccess: (String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val context = LocalContext.current

    // Colores basados en tu imagen
    val mintGreen = Color(0xFFE0F2F1) // Fondo de los inputs
    val deepTeal = Color(0xFF4DB6AC)  // Botón principal
    val darkTeal = Color(0xFF00796B)  // Texto "Libres Trabaja"

    val retrofit = remember {
        Retrofit.Builder()
            .baseUrl("https://libres-trabaja-proyecto.onrender.com")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    val apiService = remember { retrofit.create(com.example.librestrabaja.data.ApiService::class.java) }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(40.dp))

            // Imagen del logo (Deberás guardarla como logo_trabaja en drawable)
            Image(
                painter = painterResource(id = R.drawable.logo_trabaja),
                contentDescription = "Logo",
                modifier = Modifier.size(280.dp),
                contentScale = ContentScale.Fit
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Campo de Email con bordes redondeados y fondo menta
            TextField(
                value = email,
                onValueChange = { email = it },
                placeholder = { Text("Email", color = Color.Gray) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = mintGreen,
                    unfocusedContainerColor = mintGreen,
                    disabledContainerColor = mintGreen,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Campo de Contraseña
            TextField(
                value = password,
                onValueChange = { password = it },
                placeholder = { Text("Contraseña", color = Color.Gray) },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = mintGreen,
                    unfocusedContainerColor = mintGreen,
                    disabledContainerColor = mintGreen,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                )
            )

            Spacer(modifier = Modifier.height(40.dp))

            // Botón Iniciar Sesión con esquinas muy redondeadas
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
                                onLoginSuccess(email)
                            } else {
                                Toast.makeText(context, "Correo o contraseña incorrectos", Toast.LENGTH_SHORT).show()
                            }
                        }
                        override fun onFailure(call: retrofit2.Call<com.example.librestrabaja.data.RegisterResponse>, t: Throwable) {
                            Toast.makeText(context, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                        }
                    })
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(55.dp),
                shape = RoundedCornerShape(25.dp),
                colors = ButtonDefaults.buttonColors(containerColor = deepTeal)
            ) {
                Text("Iniciar Sesión", fontSize = 18.sp, fontWeight = FontWeight.Medium)
            }

            Spacer(modifier = Modifier.height(16.dp))

            TextButton(onClick = onNavigateToRegister) {
                Text("¿No tienes cuenta? Regístrate aquí", color = darkTeal)
            }
        }
    }
}