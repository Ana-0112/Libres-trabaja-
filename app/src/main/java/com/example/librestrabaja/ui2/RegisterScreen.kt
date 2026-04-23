package com.example.librestrabaja.ui

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation // Importado para ocultar contraseña
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

@Composable
fun RegisterScreen(onNavigateBack: () -> Unit, onRegisterSuccess: () -> Unit) {
    var currentStep by remember { mutableStateOf(1) }
    var selectedRole by remember { mutableStateOf("") }

    if (currentStep == 1) {
        RoleSelectionScreen(
            onRoleSelected = { role ->
                selectedRole = role
                currentStep = 2
            },
            onBack = onNavigateBack
        )
    } else {
        CuestionarioRegistro(
            role = selectedRole,
            onBack = { currentStep = 1 },
            onSuccess = onRegisterSuccess
        )
    }
}

@Composable
fun RoleSelectionScreen(onRoleSelected: (String) -> Unit, onBack: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "¿Cómo quieres usar la app?", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = { onRoleSelected("Candidato") },
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Text("Soy Candidato (Busco Empleo)")
        }

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedButton(
            onClick = { onRoleSelected("Reclutador") },
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Text("Soy Reclutador (Publicar Vacante)")
        }

        Spacer(modifier = Modifier.height(24.dp))

        TextButton(onClick = onBack) {
            Text("Volver al Login")
        }
    }
}

@Composable
fun CuestionarioRegistro(role: String, onBack: () -> Unit, onSuccess: () -> Unit) {
    val context = LocalContext.current

    // Estados para los campos comunes
    var nombre by remember { mutableStateOf("") }
    var apellidos by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") } // Estado para la contraseña

    // Estados para campos de Reclutador
    var nombreEmpresa by remember { mutableStateOf("") }
    var ubicacion by remember { mutableStateOf("") }

    var codigoVerificacion by remember { mutableStateOf("") }
    var mostrarDialogo by remember { mutableStateOf(false) }

    val retrofit = remember {
        Retrofit.Builder()
            .baseUrl("http://192.168.1.70:3000/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    val apiService = remember { retrofit.create(com.example.librestrabaja.data.ApiService::class.java) }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp).verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Registro de $role", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = nombre, onValueChange = { nombre = it }, label = { Text("Nombre(s)") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = apellidos, onValueChange = { apellidos = it }, label = { Text("Apellidos") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Correo Electrónico") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = telefono, onValueChange = { telefono = it }, label = { Text("Número de Teléfono") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(8.dp))

        // --- CAMPO DE CONTRASEÑA ---
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Contraseña") },
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation() // Esto oculta el texto con puntos
        )

        if (role == "Reclutador") {
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(value = nombreEmpresa, onValueChange = { nombreEmpresa = it }, label = { Text("Nombre de la Empresa") }, modifier = Modifier.fillMaxWidth())
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(value = ubicacion, onValueChange = { ubicacion = it }, label = { Text("Ubicación") }, modifier = Modifier.fillMaxWidth())
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = { mostrarDialogo = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Verificar y Finalizar")
        }
        TextButton(onClick = onBack) { Text("Volver") }
    }

    if (mostrarDialogo) {
        AlertDialog(
            onDismissRequest = { mostrarDialogo = false },
            title = { Text("Confirmar Registro") },
            text = {
                OutlinedTextField(value = codigoVerificacion, onValueChange = { codigoVerificacion = it }, label = { Text("Código (1234)") })
            },
            confirmButton = {
                Button(onClick = {
                    if (codigoVerificacion == "1234") {
                        val datos = com.example.librestrabaja.data.UserRequest(
                            nombre = nombre,
                            apellidos = apellidos,
                            email = email,
                            telefono = telefono,
                            password = password, // Se envía la contraseña al servidor
                            rol = role,
                            nombreEmpresa = if (role == "Reclutador") nombreEmpresa else null,
                            ubicacion = if (role == "Reclutador") ubicacion else null
                        )

                        apiService.registerUser(datos).enqueue(object : retrofit2.Callback<com.example.librestrabaja.data.RegisterResponse> {
                            override fun onResponse(call: retrofit2.Call<com.example.librestrabaja.data.RegisterResponse>, response: retrofit2.Response<com.example.librestrabaja.data.RegisterResponse>) {
                                if (response.isSuccessful) {
                                    Toast.makeText(context, "¡Registrado con éxito!", Toast.LENGTH_SHORT).show()
                                    onSuccess()
                                }
                            }
                            override fun onFailure(call: retrofit2.Call<com.example.librestrabaja.data.RegisterResponse>, t: Throwable) {
                                Toast.makeText(context, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                            }
                        })
                    }
                }) { Text("Confirmar") }
            }
        )
    }
}