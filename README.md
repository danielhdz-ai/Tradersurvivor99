# Trader Survivor - Trading Journal Profesional V2

## 🚀 Descripción

Trader Survivor es una aplicación web profesional para el seguimiento y análisis de operaciones de trading. Integrada con Firebase para autenticación y almacenamiento de datos en tiempo real.

## ✨ Características

- **Autenticación segura** con Firebase Auth
- **Base de datos en tiempo real** con Firestore
- **Gestión de cuentas** de trading múltiples
- **Registro de operaciones** detallado
- **Análisis financiero** completo
- **Dashboard interactivo** con métricas clave
- **Diseño responsive** y moderno
- **Tema oscuro** optimizado para traders

## 🛠️ Tecnologías

- HTML5, CSS3, JavaScript (ES6+)
- Firebase v12.3.0
  - Firebase Auth (Autenticación)
  - Firestore (Base de datos)
  - Firebase Analytics
- TailwindCSS para estilos
- Chart.js para gráficos
- Font Awesome para iconos

## 🔧 Configuración

### Prerrequisitos

- Node.js >= 14.0.0
- Cuenta de Firebase
- Proyecto configurado en Firebase Console

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/tradersurvivor99.git
cd tradersurvivor99
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura Firebase:
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
   - Habilita Authentication (Email/Password)
   - Habilita Firestore Database
   - Copia la configuración a `firebase-config-compat.js`

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre http://localhost:8080 en tu navegador

## 🚀 Despliegue

### Vercel (Recomendado)

1. Instala Vercel CLI:
```bash
npm install -g vercel
```

2. Despliega:
```bash
npm run deploy
```

### Netlify

1. Conecta tu repositorio de GitHub a Netlify
2. Configura el build command: `npm run build`
3. Configura el publish directory: `./`

## 📊 Estructura del Proyecto

```
tradersurvivor99/
├── index.html                 # Página principal
├── firebase-config-compat.js  # Configuración de Firebase
├── auth-service-compat.js     # Servicio de autenticación
├── database-service-compat.js # Servicio de base de datos
├── app-compat.js             # Lógica principal de la aplicación
├── package.json              # Dependencias y scripts
└── README.md                 # Documentación
```

## 🔐 Configuración de Firebase

### Firestore Database

La aplicación utiliza la siguiente estructura de datos:

```
users/
  {userId}/
    accounts/
      {accountId}/
        - name: string
        - balance: number
        - currency: string
        - platform: string
        - createdAt: timestamp
        - updatedAt: timestamp
    
    operations/
      {operationId}/
        - date: string
        - account: string
        - instrument: string
        - type: string (BUY/SELL)
        - entry: number
        - exit: number
        - volume: number
        - pl: number
        - currency: string
        - notes: string
        - createdAt: timestamp
        - updatedAt: timestamp
    
    finances/
      {financeId}/
        - date: string
        - amount: number
        - currency: string
        - notes: string
        - createdAt: timestamp
        - updatedAt: timestamp
    
    settings:
      - currency: string
      - theme: string
    
    createdAt: timestamp
    lastLogin: timestamp
```

### Reglas de Seguridad de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso a los datos del usuario autenticado
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permitir acceso a las subcolecciones del usuario
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🎯 Funcionalidades

### Autenticación
- Registro de nuevos usuarios
- Inicio de sesión con email/contraseña
- Recuperación de contraseña
- Cierre de sesión seguro

### Gestión de Cuentas
- Crear múltiples cuentas de trading
- Editar información de cuentas
- Eliminar cuentas
- Soporte para diferentes divisas y plataformas

### Registro de Operaciones
- Agregar operaciones detalladas
- Editar operaciones existentes
- Eliminar operaciones
- Cálculo automático de P&L
- Notas y análisis por operación

### Análisis Financiero
- Dashboard con métricas clave
- Win Rate y Profit Factor
- Evolución de la cuenta
- Registro de ingresos/gastos
- Balance neto total

### Características Adicionales
- Noticias del mercado (TradingView)
- Calendario económico
- Diseño responsive
- Tema oscuro profesional

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Email: daniel.hdz.trader@gmail.com
- GitHub Issues: [Crear Issue](https://github.com/tu-usuario/tradersurvivor99/issues)

## 🔄 Changelog

### v1.0.0
- Integración completa con Firebase
- Sistema de autenticación
- CRUD completo para cuentas, operaciones y finanzas
- Dashboard interactivo
- Diseño responsive

---

**Desarrollado con ❤️ para la comunidad de traders**
