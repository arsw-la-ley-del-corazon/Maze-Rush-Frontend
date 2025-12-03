# Maze-Rush-Frontend

Frontend moderno para Maze Rush - Juego multijugador de laberintos con autenticación Google OAuth2.

## 🚀 Características

- **Autenticación con Google**: Inicio de sesión seguro mediante Google OAuth2
- **Interfaz Moderna**: UI construida con React 18 + TypeScript + Material-UI
- **Tiempo Real**: Comunicación con WebSockets para juego multijugador
- **Responsive Design**: Diseño adaptable a diferentes dispositivos

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Google Cloud para OAuth2 credentials

## ⚙️ Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Maze-Rush-Frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura las siguientes variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Google OAuth2
VITE_GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
```

### 4. Obtener Google Client ID

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "APIs & Services" > "Credentials"
4. Crea credenciales de tipo "OAuth 2.0 Client ID"
5. Configura los **Authorized JavaScript origins**:
   - `http://localhost:3000` (para desarrollo)
   - Tu dominio de producción
6. Copia el **Client ID** y pégalo en `VITE_GOOGLE_CLIENT_ID`

## 🏃 Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Construir para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

## 📁 Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
├── context/         # React Context (AuthContext, SocketContext)
├── features/        # Características por módulo
│   ├── login/       # Página de login con Google OAuth
│   ├── dashboard/   # Dashboard principal
│   ├── profile/     # Perfil de usuario
│   └── quickplay/   # Juego rápido
├── common/          # Utilidades y configuración compartida
└── types/           # Definiciones de TypeScript
```

## 🔒 Autenticación

Este proyecto utiliza **únicamente Google OAuth2** para autenticación:

- No hay registro tradicional con email/password
- Los usuarios inician sesión con su cuenta de Google
- Los tokens JWT se gestionan automáticamente
- Refresh tokens para sesiones persistentes

## 🛠️ Tecnologías

- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Material-UI** - Componentes UI
- **Axios** - Cliente HTTP
- **React Router** - Navegación
- **Google Identity Services** - Autenticación OAuth2

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza el build de producción
- `npm run lint` - Ejecuta el linter

## 🔗 Integración con Backend

Asegúrate de que el backend esté configurado y corriendo en la URL especificada en `VITE_API_BASE_URL`. El backend debe soportar:

- Endpoint `/api/v1/auth/google` para autenticación
- Endpoint `/api/v1/auth/refresh` para renovar tokens
- Endpoint `/api/v1/auth/logout` para cerrar sesión
- WebSocket connection para juego en tiempo real

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
