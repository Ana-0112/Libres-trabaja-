package com.example.librestrabaja.ui2

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.* // Este importa Button, Card, Divider, etc.
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// --- PALETA DE COLORES DE LIBRES TRABAJA ---
val DeepTeal = Color(0xFF4DB6AC)
val DarkTeal = Color(0xFF00796B)
val LightTeal = Color(0xFFE0F2F1)
val BackgroundGray = Color(0xFFF5F5F5)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobFeedScreen(onNavigateToProfile: () -> Unit, onNavigateToApplications: () -> Unit) {
    var selectedTab by remember { mutableStateOf(0) }
    var searchText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text("Libres Trabaja", fontWeight = FontWeight.Bold, color = Color.White)
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = DarkTeal
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.List, contentDescription = "Feed") },
                    label = { Text("Feed") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DarkTeal,
                        selectedTextColor = DarkTeal,
                        unselectedIconColor = Color.Gray
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = {
                        selectedTab = 1
                        onNavigateToApplications()
                    },
                    icon = { Icon(Icons.Default.AssignmentTurnedIn, contentDescription = "Postulaciones") },
                    label = { Text("Mis Postulaciones") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DarkTeal,
                        selectedTextColor = DarkTeal,
                        unselectedIconColor = Color.Gray
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = {
                        selectedTab = 2
                        onNavigateToProfile()
                    },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Perfil") },
                    label = { Text("Perfil") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = DarkTeal,
                        selectedTextColor = DarkTeal,
                        unselectedIconColor = Color.Gray
                    )
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundGray)
        ) {
            // Buscador estilizado
            OutlinedTextField(
                value = searchText,
                onValueChange = { searchText = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Buscar por sector...", color = Color.Gray) },
                shape = RoundedCornerShape(12.dp),
                singleLine = true,
                // AQUÍ ESTÁ EL CAMBIO:
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White,
                    focusedBorderColor = DeepTeal,
                    unfocusedBorderColor = Color.LightGray,
                    cursorColor = DarkTeal
                ),
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = DeepTeal)
                }
            )
            Text(
                text = "Vacantes Recientes",
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = DarkTeal
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Lista de ejemplo (Luego la conectaremos a tu MongoDB)
                items(5) {
                    VacanteCard()
                }
            }
        }
    }
}

@Composable
fun VacanteCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Avatar o Icono de Empresa
                Surface(
                    modifier = Modifier.size(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = LightTeal
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Business,
                            contentDescription = null,
                            tint = DarkTeal,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Abarrotes El Centro",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = DarkTeal
                    )
                    Text(
                        text = "Cajero(a) • $8,000/mes",
                        color = Color.DarkGray,
                        fontSize = 14.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Divider(color = BackgroundGray, thickness = 1.dp)

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Publicado hace 6 horas",
                    fontSize = 12.sp,
                    color = Color.Gray
                )

                Button(
                    onClick = { /* Lógica para postularse */ },
                    colors = ButtonDefaults.buttonColors(containerColor = DeepTeal),
                    shape = RoundedCornerShape(25.dp),
                    contentPadding = PaddingValues(horizontal = 24.dp, vertical = 8.dp)
                ) {
                    Text("Postularme", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}