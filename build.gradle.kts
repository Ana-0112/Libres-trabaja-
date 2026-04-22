plugins {
    // Versión estable del plugin de Android
    id("com.android.application") version "8.9.1" apply false
    id("com.android.library") version "8.1.0" apply false


    // Versión de Kotlin (Usa la 2.0.0 que es la que integra Compose correctamente)
    id("org.jetbrains.kotlin.android") version "2.0.0" apply false

    // Este es el nuevo ID para el compilador de Compose en Kotlin 2.0+
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.0" apply false
}