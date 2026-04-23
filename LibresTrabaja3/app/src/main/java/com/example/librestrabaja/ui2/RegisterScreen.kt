package com.example.librestrabaja.ui

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CuestionarioRegistro(role: String, onBack: () -> Unit, onSuccess: () -> Unit) {
    val context = LocalContext.current

    // Estados de los campos
    var nombre by remember { mutableStateOf("") }
    var apellidos by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var nombreEmpresa by remember { mutableStateOf("") }
    var ubicacion by remember { mutableStateOf("") }

    // Estados para las Alertas
    var mostrarPopUpVerificacion by remember { mutableStateOf(false) }
    var codigoVerificacion by remember { mutableStateOf("") }
    var mostrarAlertaExito by remember { mutableStateOf(false) }

    val retrofit = remember {
        Retrofit.Builder()
            .baseUrl("https://libres-trabaja-proyecto.onrender.com/")
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
        OutlinedTextField(value = telefono, onValueChange = { telefono = it }, label = { Text("Número de Teléfono") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone))
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Contraseña") },
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                val image = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(imageVector = image, contentDescription = "Ojo")
                }
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )

        if (role == "Reclutador") {
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(value = nombreEmpresa, onValueChange = { nombreEmpresa = it }, label = { Text("Nombre de la Empresa") }, modifier = Modifier.fillMaxWidth())
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(value = ubicacion, onValueChange = { ubicacion = it }, label = { Text("Ubicación") }, modifier = Modifier.fillMaxWidth())
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                if (nombre.isNotBlank() && email.isNotBlank() && password.isNotBlank()) {
                    mostrarPopUpVerificacion = true // Paso 1: Abrir verificador
                } else {
                    Toast.makeText(context, "Por favor llena los campos obligatorios", Toast.LENGTH_SHORT).show()
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp)
        ) {
            Text("Registrar")
        }

        TextButton(onClick = onBack) { Text("Volver") }
    }

    // --- POP-UP DE VERIFICACIÓN (1234) ---
    if (mostrarPopUpVerificacion) {
        AlertDialog(
            onDismissRequest = { mostrarPopUpVerificacion = false },
            title = { Text("Verificación de Seguridad") },
            text = {
                Column {
                    Text("Introduce el código de verificación enviado (Prueba: 1234)")
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = codigoVerificacion,
                        onValueChange = { if (it.length <= 4) codigoVerificacion = it },
                        label = { Text("Código") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    if (codigoVerificacion == "1234") {
                        val datos = com.example.librestrabaja.data.RegisterRequest(
                            nombres = nombre,
                            apellidos = apellidos,
                            email = email,
                            telefono = telefono,
                            password = password,
                            role = role,
                            nombreEmpresa = if (role == "Reclutador") nombreEmpresa else null,
                            ubicacion = if (role == "Reclutador") ubicacion else null
                        )

                        apiService.registerUser(datos).enqueue(object : retrofit2.Callback<com.example.librestrabaja.data.RegisterResponse> {
                            override fun onResponse(call: retrofit2.Call<com.example.librestrabaja.data.RegisterResponse>, response: retrofit2.Response<com.example.librestrabaja.data.RegisterResponse>) {
                                if (response.isSuccessful) {
                                    mostrarPopUpVerificacion = false
                                    mostrarAlertaExito = true // Paso 2: Mostrar éxito
                                } else {
                                    Toast.makeText(context, "Error: El usuario ya existe", Toast.LENGTH_SHORT).show()
                                }
                            }
                            override fun onFailure(call: retrofit2.Call<com.example.librestrabaja.data.RegisterResponse>, t: Throwable) {
                                Toast.makeText(context, "Error de red: ${t.message}", Toast.LENGTH_SHORT).show()
                            }
                        })
                    } else {
                        Toast.makeText(context, "Código incorrecto", Toast.LENGTH_SHORT).show()
                    }
                }) {
                    Text("Confirmar")
                }
            }
        )
    }

    // --- ALERTA DE ÉXITO FINAL ---
    if (mostrarAlertaExito) {
        AlertDialog(
            onDismissRequest = { },
            title = { Text("¡Todo listo!", fontWeight = FontWeight.Bold) },
            text = { Text("Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.") },
            confirmButton = {
                Button(
                    onClick = {
                        mostrarAlertaExito = false
                        onSuccess() // Regresa al Login
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(25.dp)
                ) {
                    Text("Ir al Inicio de Sesión")
                }
            }
        )
    }
}