# 🚀 Configuración de Base de Datos Supabase para Trading Journal

## 📋 Pasos para Configurar Supabase

### 1. Crear las Tablas en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva consulta
4. Copia y pega todo el contenido del archivo `setup_database.sql`
5. Ejecuta la consulta haciendo clic en **RUN**

### 2. Verificar la Configuración

Después de ejecutar el script SQL, deberías ver las siguientes tablas en la sección **Table Editor**:

- ✅ `accounts` - Cuentas de trading
- ✅ `operations` - Operaciones/trades
- ✅ `finances` - Movimientos financieros
- ✅ `user_settings` - Configuraciones de usuario

### 3. Configuración de Autenticación

En tu proyecto Supabase:

1. Ve a **Authentication** → **Settings**
2. Asegúrate de que esté habilitado **Enable email confirmations** si quieres verificación por email
3. Configura las URLs de redirección si es necesario

### 4. Configuración Completada ✅

Una vez ejecutado el script SQL, tu aplicación estará lista para:

- 🔐 **Autenticación**: Login y registro de usuarios
- 💾 **Guardado**: Todas las operaciones se guardan automáticamente en Supabase
- 🔒 **Seguridad**: Cada usuario solo ve sus propios datos (RLS habilitado)
- 🔄 **Sincronización**: Los datos se sincronizan entre dispositivos
- 🏦 **Respaldo**: Tus datos están seguros en la nube

## 🎯 Características Implementadas

### Sistema de Autenticación
- ✅ Login con email/contraseña
- ✅ Registro de nuevos usuarios
- ✅ Sesiones persistentes
- ✅ Logout seguro
- ✅ Protección de rutas

### Base de Datos en la Nube
- ✅ Guardado automático de operaciones
- ✅ Sincronización de cuentas de trading
- ✅ Historial de finanzas
- ✅ Configuraciones de usuario
- ✅ Seguridad por usuario (RLS)

### Funcionalidades Híbridas
- ✅ Guardado local (IndexedDB) + nube (Supabase)
- ✅ Funciona offline y sincroniza online
- ✅ Respaldo automático en la nube
- ✅ Recuperación de datos entre dispositivos

## 🔧 Solución de Problemas

### Si los datos no se guardan en Supabase:

1. **Verifica la autenticación**: Asegúrate de estar logueado
2. **Revisa la consola**: Abre las herramientas de desarrollador (F12) y revisa si hay errores en la consola
3. **Verifica las tablas**: Confirma que todas las tablas se crearon correctamente en Supabase
4. **Revisa RLS**: Asegúrate de que las políticas de Row Level Security estén configuradas

### Si hay errores de conexión:

1. **Verifica las credenciales**: URL y API Key en el código
2. **Revisa la red**: Asegúrate de tener conexión a internet
3. **Verifica el proyecto**: Confirma que el proyecto Supabase esté activo

## 📊 Estructura de Datos

### Tabla `accounts`
- Almacena las cuentas de trading
- Incluye balance inicial y actual
- Vinculada al usuario autenticado

### Tabla `operations`
- Todas las operaciones/trades
- Incluye imágenes, P&L, y detalles completos
- Filtrada por usuario

### Tabla `finances`
- Movimientos financieros (depósitos, retiros, gastos)
- Historial completo de finanzas
- Separada por usuario

### Tabla `user_settings`
- Configuraciones personalizadas
- API keys y preferencias
- Específica por usuario

¡Tu Trading Journal ahora está completamente integrado con Supabase! 🎉