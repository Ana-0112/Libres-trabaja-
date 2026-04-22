package com.example.librestrabaja

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.librestrabaja.ui.theme.LibresTrabajaTheme
import com.example.librestrabaja.ui.RegisterScreen
import com.example.librestrabaja.ui2.LoginScreen // O .ui.LoginScreen si ya lo moviste


// 1. Definición de Rutas
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
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
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
                                    navController.navigate(Screen.Feed.route) {
                                        popUpTo(Screen.Login.route) { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable(Screen.Feed.route) {
                            FeedVacantesScreen(onBack = { navController.popBackStack() })
                        }
                    }
                }
            }
        }
    }
}

// --- PANTALLAS ---

@Composable
fun LoginScreen(onNavigateToRegister: () -> Unit, onLoginSuccess: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Libres Trabaja", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(40.dp))
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Contraseña") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(32.dp))
        Button(onClick = onLoginSuccess, modifier = Modifier.fillMaxWidth().height(50.dp)) { Text("Iniciar Sesión") }
        TextButton(onClick = onNavigateToRegister) { Text("¿No tienes cuenta? Regístrate aquí") }
    }
}

@Composable
fun RegisterScreen(onNavigateBack: () -> Unit, onRegisterSuccess: () -> Unit) {
    var currentStep by remember { mutableStateOf(1) }
    var selectedRole by remember { mutableStateOf("") }

    if (currentStep == 1) {
        Column(modifier = Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text("¿Cómo quieres usar la app?", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(32.dp))
            Button(onClick = { selectedRole = "Candidato"; currentStep = 2 }, modifier = Modifier.fillMaxWidth()) { Text("Soy Candidato") }
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(onClick = { selectedRole = "Reclutador"; currentStep = 2 }, modifier = Modifier.fillMaxWidth()) { Text("Soy Reclutador") }
            TextButton(onClick = onNavigateBack) { Text("Volver al Login") }
        }
    } else {
        CuestionarioRegistro(role = selectedRole, onBack = { currentStep = 1 }, onSuccess = onRegisterSuccess)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CuestionarioRegistro(role: String, onBack: () -> Unit, onSuccess: () -> Unit) {
    val context = LocalContext.current
    var email by remember { mutableStateOf("") }
    var codigo by remember { mutableStateOf("") }
    var mostrarPopUp by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp).verticalScroll(rememberScrollState()), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Registro de $role", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(20.dp))
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(32.dp))
        Button(onClick = { mostrarPopUp = true }, modifier = Modifier.fillMaxWidth()) { Text("Verificar") }
        TextButton(onClick = onBack) { Text("Cambiar Rol") }
    }

    if (mostrarPopUp) {
        AlertDialog(
            onDismissRequest = { mostrarPopUp = false },
            title = { Text("Verificación") },
            text = { OutlinedTextField(value = codigo, onValueChange = { codigo = it }, label = { Text("Código (1234)") }) },
            confirmButton = {
                Button(onClick = {
                    if (codigo == "1234") {
                        Toast.makeText(context, "¡Verificado!", Toast.LENGTH_SHORT).show()
                        onSuccess()
                    }
                }) { Text("Confirmar") }
            }
        )
    }
}

// --- FEED DE VACANTES (Basado en tu boceto image_293297.jpg) ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedVacantesScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Feed de Vacantes", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Volver") }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).background(Color(0xFFF5F5F5))) {
            OutlinedTextField(
                value = "", onValueChange = {},
                placeholder = { Text("Buscar por sector...") },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                leadingIcon = { Icon(Icons.Default.Search, null) },
                shape = RoundedCornerShape(12.dp)
            )
            Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
                VacanteCard("Abarrotes El Centro", "Cajero(a)", "$8,000/mes")
                VacanteCard("Hacienda La Esperanza", "Jornalero", "$8,500/mes")
                VacanteCard("Taller El Tigre", "Mecánico", "$9,000/mes")
            }
        }
    }
}

@Composable
fun VacanteCard(empresa: String, puesto: String, sueldo: String) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), elevation = CardDefaults.cardElevation(4.dp)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(empresa, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text("$puesto - $sueldo", color = Color.Gray)
            Button(onClick = { /* Postular */ }, modifier = Modifier.align(Alignment.End)) { Text("Postularme") }
        }
    }
}