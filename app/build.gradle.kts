plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android") // Borra la parte de: version "1.9.0"
    id("org.jetbrains.kotlin.plugin.compose") // Borra la parte de: version "1.9.0"
}
android {
    namespace = "com.example.librestrabaja"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.example.librestrabaja"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        // Aseguramos compatibilidad con Java 17 según la configuración de la IDE
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        // Alineamos el target de Kotlin con la JVM 17 seleccionada
        jvmTarget = "17"
    }

    buildFeatures {
        // Habilitamos Jetpack Compose
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // --- LIBRERÍAS CORE ---
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)

    // --- JETPACK COMPOSE (MATERIAL 3) ---
    // Usamos el BOM para asegurar que todas las librerías de Compose sean compatibles entre sí
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // --- NAVEGACIÓN ---
    // Versión estable para manejar el flujo entre pantallas (Login, Registro, etc.)
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // --- TESTING ---
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0") // Para entender JSON
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0") // Para ver errores de red

    // --- HERRAMIENTAS DE DESARROLLO (DEBUG) ---
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    implementation("androidx.compose.material:material-icons-extended")
}