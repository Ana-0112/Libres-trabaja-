package com.example.librestrabaja

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.librestrabaja.ui.theme.LibresTrabajaTheme
// IMPORTACIONES DE TU PAQUETE DATA Y UI2
import com.example.librestrabaja.data.ApiService
import com.example.librestrabaja.data.LoginRequest
import com.example.librestrabaja.data.RegisterRequest
import com.example.librestrabaja.data.RegisterResponse
import com.example.librestrabaja.ui2.JobFeedScreen // Nueva pantalla
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

// --- COLORES GLOBALES ---
val MintGreen = Color(0xFFE0F2F1)
val DeepTeal = Color(0xFF4DB6AC)
val DarkTeal = Color(0xFF00796B)
val TextDarkGray = Color(0xFF424242)

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Feed : Screen("feed")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LibresTrabajaTheme {
                val navController = rememberNavController()
                Surface(modifier = Modifier.fillMaxSize(), color = Color.White) {
                    NavHost(navController = navController, startDestination = Screen.Login.route) {
                        composable(Screen.Login.route) {
                            LoginScreen(
                                onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                                onLoginSuccess = { navController.navigate(Screen.Feed.route) }
                            )
                        }
                        composable(Screen.Register.route) {
                            RegisterScreen(
                                onNavigateBack = { navController.popBackStack() },
                                onRegisterSuccess = {
                                    navController.navigate(Screen.Login.route) {
                                        popUpTo(Screen.Login.route) { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable(Screen.Feed.route) {
                            // Cambiado para usar el nuevo diseño con navegación inferior
                            JobFeedScreen(
                                onNavigateToProfile = { /* navController.navigate("perfil") */ },
                                onNavigateToApplications = { /* navController.navigate("postulaciones") */ }
                            )
                        }
                    }
                }
            }
        }
    }
}

// --- LOGIN ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(onNavigateToRegister: () -> Unit, onLoginSuccess: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val context = LocalContext.current

    val retrofit = remember {
        Retrofit.Builder()
            .baseUrl("https://libres-trabaja-proyecto.onrender.com")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    val apiService = remember { retrofit.create(ApiService::class.java) }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Column(modifier = Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(modifier = Modifier.height(40.dp))
            Image(painter = painterResource(id = R.drawable.logo_trabaja), contentDescription = "Logo", modifier = Modifier.size(180.dp), contentScale = ContentScale.Fit)
            Text(text = "Libres Trabaja", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = DarkTeal)
            Spacer(modifier = Modifier.height(30.dp))
            CustomTextField(value = email, onValueChange = { email = it }, placeholder = "Email")
            Spacer(modifier = Modifier.height(16.dp))
            CustomTextField(value = password, onValueChange = { password = it }, placeholder = "Contraseña", isPassword = true)
            Spacer(modifier = Modifier.height(40.dp))
            CustomButton(text = "Iniciar Sesión", onClick = {
                val loginData = LoginRequest(email, password)
                apiService.loginUser(loginData).enqueue(object : Callback<RegisterResponse> {
                    override fun onResponse(call: Call<RegisterResponse>, response: Response<RegisterResponse>) {
                        if (response.isSuccessful) onLoginSuccess() else Toast.makeText(context, "Credenciales incorrectas", Toast.SHORT).show()
                    }
                    override fun onFailure(call: Call<RegisterResponse>, t: Throwable) {
                        Toast.makeText(context, "Error de red", Toast.LENGTH_SHORT).show()
                    }
                })
            })
            TextButton(onClick = onNavigateToRegister) { Text("¿No tienes cuenta? Regístrate aquí", color = DarkTeal) }
        }
    }
}

// --- NAVEGACIÓN DE REGISTRO ---
@Composable
fun RegisterScreen(onNavigateBack: () -> Unit, onRegisterSuccess: () -> Unit) {
    var currentStep by remember { mutableStateOf(1) }
    var selectedRole by remember { mutableStateOf("") }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        if (currentStep == 1) {
            Column(modifier = Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Text("¿Cómo quieres usar la app?", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = DarkTeal)
                Spacer(modifier = Modifier.height(40.dp))
                CustomButton(text = "Soy Candidato", onClick = { selectedRole = "Candidato"; currentStep = 2 })
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedButton(
                    onClick = { selectedRole = "Reclutador"; currentStep = 2 },
                    modifier = Modifier.fillMaxWidth().height(55.dp),
                    shape = RoundedCornerShape(25.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = DeepTeal),
                    border = BorderStroke(1.dp, DeepTeal)
                ) {
                    Text("Soy Reclutador", fontSize = 18.sp)
                }
                Spacer(modifier = Modifier.height(24.dp))
                TextButton(onClick = onNavigateBack) { Text("Volver al Login", color = DarkTeal) }
            }
        } else {
            CuestionarioRegistro(role = selectedRole, onBack = { currentStep = 1 }, onSuccess = onRegisterSuccess)
        }
    }
}

// --- FORMULARIO Y VALIDACIÓN ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CuestionarioRegistro(role: String, onBack: () -> Unit, onSuccess: () -> Unit) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    var nombres by remember { mutableStateOf("") }
    var apellidos by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var nombreEmpresa by remember { mutableStateOf("") }
    var ubicacion by remember { mutableStateOf("") }

    var codigoVerificacion by remember { mutableStateOf("") }
    var mostrarPopUpVerificacion by remember { mutableStateOf(false) }
    var mostrarExitoRegistro by remember { mutableStateOf(false) }

    val retrofit = remember {
        Retrofit.Builder()
            .baseUrl("https://libres-trabaja-proyecto.onrender.com")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    val apiService = remember { retrofit.create(ApiService::class.java) }

    Column(
        modifier = Modifier.fillMaxSize().background(Color.White).verticalScroll(scrollState).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(20.dp))
        Text("Registro de $role", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = DarkTeal)
        Spacer(modifier = Modifier.height(30.dp))

        CustomTextField(value = nombres, onValueChange = { nombres = it }, placeholder = "Nombre(s)")
        Spacer(modifier = Modifier.height(12.dp))
        CustomTextField(value = apellidos, onValueChange = { apellidos = it }, placeholder = "Apellidos")
        Spacer(modifier = Modifier.height(12.dp))
        CustomTextField(value = email, onValueChange = { email = it }, placeholder = "Correo Electrónico")
        Spacer(modifier = Modifier.height(12.dp))
        CustomTextField(value = telefono, onValueChange = { telefono = it }, placeholder = "Número de Teléfono")
        Spacer(modifier = Modifier.height(12.dp))
        CustomTextField(value = password, onValueChange = { password = it }, placeholder = "Contraseña", isPassword = true)

        if (role == "Reclutador") {
            Spacer(modifier = Modifier.height(12.dp))
            CustomTextField(value = nombreEmpresa, onValueChange = { nombreEmpresa = it }, placeholder = "Nombre de la Empresa")
            Spacer(modifier = Modifier.height(12.dp))
            CustomTextField(value = ubicacion, onValueChange = { ubicacion = it }, placeholder = "Ubicación")
        }

        Spacer(modifier = Modifier.height(40.dp))

        CustomButton(text = "Verificar y Finalizar", onClick = {
            val estaVacio = if (role == "Reclutador") {
                nombres.isEmpty() || apellidos.isEmpty() || email.isEmpty() || telefono.isEmpty() || password.isEmpty() || nombreEmpresa.isEmpty() || ubicacion.isEmpty()
            } else {
                nombres.isEmpty() || apellidos.isEmpty() || email.isEmpty() || telefono.isEmpty() || password.isEmpty()
            }

            if (estaVacio) {
                Toast.makeText(context, "Falta completar el cuestionario", Toast.LENGTH_SHORT).show()
            } else {
                mostrarPopUpVerificacion = true
            }
        })

        Spacer(modifier = Modifier.height(16.dp))
        TextButton(onClick = onBack) { Text("Volver / Cambiar Rol", color = DarkTeal) }
        Spacer(modifier = Modifier.height(24.dp))
    }

    if (mostrarPopUpVerificacion) {
        AlertDialog(
            onDismissRequest = { mostrarPopUpVerificacion = false },
            title = { Text("Verificación", color = DarkTeal) },
            text = {
                Column {
                    Text("Ingresa '1234' para confirmar tu correo.", color = Color.Gray)
                    Spacer(modifier = Modifier.height(12.dp))
                    CustomTextField(value = codigoVerificacion, onValueChange = { codigoVerificacion = it }, placeholder = "Código")
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    if (codigoVerificacion == "1234") {
                        val userData = RegisterRequest(
                            nombres = nombres,
                            apellidos = apellidos,
                            email = email,
                            telefono = telefono,
                            password = password,
                            role = role,
                            nombreEmpresa = if (role == "Reclutador") nombreEmpresa else null,
                            ubicacion = if (role == "Reclutador") ubicacion else null
                        )

                        apiService.registerUser(userData).enqueue(object : Callback<RegisterResponse> {
                            override fun onResponse(call: Call<RegisterResponse>, response: Response<RegisterResponse>) {
                                if (response.isSuccessful) {
                                    mostrarPopUpVerificacion = false
                                    mostrarExitoRegistro = true
                                } else {
                                    Toast.makeText(context, "Error al registrar", Toast.LENGTH_SHORT).show()
                                }
                            }
                            override fun onFailure(call: Call<RegisterResponse>, t: Throwable) {
                                Toast.makeText(context, "Error de conexión", Toast.LENGTH_SHORT).show()
                            }
                        })
                    } else {
                        Toast.makeText(context, "Código incorrecto", Toast.LENGTH_SHORT).show()
                    }
                }) { Text("Confirmar", color = DarkTeal) }
            },
            containerColor = Color.White
        )
    }

    if (mostrarExitoRegistro) {
        AlertDialog(
            onDismissRequest = { },
            title = { Text("¡Éxito!", color = DarkTeal) },
            text = { Text("Registro completado exitosamente en Libres Trabaja.", color = TextDarkGray) },
            confirmButton = {
                Button(onClick = { mostrarExitoRegistro = false; onSuccess() }, colors = ButtonDefaults.buttonColors(containerColor = DeepTeal)) {
                    Text("Ir al Inicio de Sesión")
                }
            },
            containerColor = Color.White
        )
    }
}

// --- COMPONENTES REUTILIZABLES ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomTextField(value: String, onValueChange: (String) -> Unit, placeholder: String, isPassword: Boolean = false) {
    var passwordVisible by remember { mutableStateOf(false) }

    TextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, color = Color.Gray) },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        textStyle = TextStyle(color = TextDarkGray, fontSize = 16.sp),
        visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
        trailingIcon = {
            if (isPassword) {
                val icon = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(imageVector = icon, contentDescription = "Ver contraseña", tint = DarkTeal)
                }
            }
        },
        colors = TextFieldDefaults.colors(
            focusedContainerColor = MintGreen,
            unfocusedContainerColor = MintGreen,
            focusedIndicatorColor = Color.Transparent,
            unfocusedIndicatorColor = Color.Transparent,
            cursorColor = DarkTeal
        )
    )
}

@Composable
fun CustomButton(text: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(55.dp),
        shape = RoundedCornerShape(25.dp),
        colors = ButtonDefaults.buttonColors(containerColor = DeepTeal)
    ) {
        Text(text, fontSize = 18.sp, fontWeight = FontWeight.Medium, color = Color.White)
    }
}