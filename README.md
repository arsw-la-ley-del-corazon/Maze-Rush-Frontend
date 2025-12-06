<div align="center">

# 🎮 Maze Rush Frontend

[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Material UI](https://img.shields.io/badge/MUI-7.3-007FFF?style=flat-square&logo=mui&logoColor=white)](https://mui.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Juego multijugador de laberintos en tiempo real con autenticación Google OAuth2**

[Demo](#-demo) • [Instalación](#-instalación-rápida) • [Documentación](#-estructura-del-proyecto) • [Contribuir](#-contribuir)

</div>

---

## 📖 Descripción

Maze Rush es un emocionante juego multijugador donde los jugadores compiten para escapar de laberintos generados proceduralmente. Este repositorio contiene el **frontend** de la aplicación, construido con tecnologías modernas de React.

### ✨ Características Principales

- 🔐 **Autenticación con Google OAuth2** - Inicio de sesión seguro y sin contraseñas
- 🎯 **Juego en Tiempo Real** - Comunicación WebSocket para partidas multijugador
- 🎨 **UI Moderna** - Interfaz construida con Material-UI y animaciones fluidas
- 📱 **Responsive Design** - Experiencia optimizada para desktop y móvil
- 🧪 **Testing Completo** - Cobertura con Vitest y React Testing Library
- ⚡ **Alto Rendimiento** - Build optimizado con Vite y code splitting

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnologías |
|-----------|-------------|
| **Core** | React 19, TypeScript 5.9 |
| **Build Tool** | Vite 7.1 |
| **UI Framework** | Material-UI 7.3, Emotion, Styled Components |
| **Routing** | React Router 7.9 |
| **HTTP Client** | Axios |
| **WebSockets** | STOMP.js, SockJS |
| **Testing** | Vitest, React Testing Library, jsdom |
| **Linting** | ESLint 9, Biome |
| **Autenticación** | Google Identity Services (OAuth2) |

---

## 📋 Requisitos Previos

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Backend** [Maze-Rush-Backend](https://github.com/arsw-la-ley-del-corazon/Maze-Rush-Backend) corriendo
- **Google Cloud Console** - Credenciales OAuth2 configuradas

---

## 🚀 Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/arsw-la-ley-del-corazon/Maze-Rush-Frontend.git
cd Maze-Rush-Frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
# API Backend
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Google OAuth2 (requerido)
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

# WebSocket
VITE_SOCKET_URL=http://localhost:8080
```

### 4. Iniciar servidor de desarrollo

```bash
npm run dev
```

🎉 La aplicación estará disponible en **http://localhost:3000**

---

## 🔑 Configuración de Google OAuth2

<details>
<summary><strong>📝 Pasos detallados para obtener Google Client ID</strong></summary>

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Navega a **APIs & Services** > **Credentials**
4. Click en **Create Credentials** > **OAuth 2.0 Client ID**
5. Selecciona **Web application**
6. Configura los **Authorized JavaScript origins**:
   - Desarrollo: `http://localhost:3000`
   - Producción: `https://tu-dominio.com`
7. Configura los **Authorized redirect URIs**:
   - Desarrollo: `http://localhost:3000`
   - Producción: `https://tu-dominio.com`
8. Copia el **Client ID** generado
9. Pégalo en tu archivo `.env` como `VITE_GOOGLE_CLIENT_ID`

</details>

---

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | 🚀 Inicia servidor de desarrollo |
| `npm run dev:host` | 🌐 Servidor de desarrollo accesible en red |
| `npm run build` | 📦 Compila para producción |
| `npm run preview` | 👁️ Previsualiza build de producción |
| `npm run test` | 🧪 Ejecuta tests en modo watch |
| `npm run test:run` | ✅ Ejecuta todos los tests una vez |
| `npm run test:ui` | 🎨 Ejecuta tests con UI de Vitest |
| `npm run coverage` | 📊 Genera reporte de cobertura |
| `npm run lint` | 🔍 Ejecuta ESLint |
| `npm run lint:fix` | 🔧 Corrige errores de ESLint automáticamente |
| `npm run format` | ✨ Formatea código con Biome |
| `npm run type-check` | 📝 Verifica tipos de TypeScript |
| `npm run validate` | ✅ Ejecuta type-check + lint + tests |
| `npm run ci` | 🔄 Validación completa + build (para CI/CD) |
| `npm run clean` | 🧹 Limpia archivos de build y cache |

---

## 📁 Estructura del Proyecto

```
src/
├── assets/              # Recursos estáticos (imágenes, fuentes)
├── common/              # Utilidades compartidas
│   ├── AxiosInstance.ts # Cliente HTTP configurado
│   ├── logger.ts        # Sistema de logging
│   └── globas.ts        # Variables globales
├── components/          # Componentes reutilizables
│   ├── AppShell.tsx     # Layout principal
│   ├── Loader.tsx       # Componente de carga
│   ├── Maze.tsx         # Renderizado del laberinto
│   └── WinDialog.tsx    # Modal de victoria
├── context/             # React Context providers
│   ├── AuthContext.tsx  # Estado de autenticación
│   ├── SocketContext.tsx    # WebSocket del juego
│   └── LobbySocketContext.tsx # WebSocket del lobby
├── features/            # Módulos por funcionalidad
│   ├── home/            # Página principal
│   ├── login/           # Autenticación Google OAuth
│   ├── signup/          # Registro de usuarios
│   ├── dashboard/       # Panel principal del usuario
│   ├── lobby/           # Sala de espera multijugador
│   ├── game/            # Lógica y UI del juego
│   └── profile/         # Perfil de usuario
├── hooks/               # Custom hooks
│   └── useRoomUpdates.ts # Hook para actualizaciones de sala
├── lib/                 # Librerías y utilidades
│   ├── maze-generator.ts # Generador de laberintos
│   └── utils.ts         # Funciones utilitarias
├── test/                # Configuración de tests
│   └── setup.ts         # Setup de Vitest
├── types/               # Definiciones de TypeScript
│   ├── api.ts           # Tipos de API
│   └── env.d.ts         # Tipos de variables de entorno
├── App.tsx              # Componente raíz con rutas
├── main.tsx             # Punto de entrada
└── global.css           # Estilos globales
```

---

## 🔗 Integración con Backend

El frontend requiere el [Maze-Rush-Backend](https://github.com/arsw-la-ley-del-corazon/Maze-Rush-Backend) corriendo. 

### Endpoints Requeridos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/google` | Autenticación con Google |
| `POST` | `/api/v1/auth/refresh` | Renovar token JWT |
| `POST` | `/api/v1/auth/logout` | Cerrar sesión |
| `WS` | `/ws` | WebSocket para juego en tiempo real |

---

## 🐳 Docker

```bash
# Construir imagen
docker build -t maze-rush-frontend .

# Ejecutar contenedor
docker run -p 3000:3000 maze-rush-frontend
```

O usando Docker Compose (desde el directorio raíz del proyecto):

```bash
docker-compose up frontend
```

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test:run

# Tests con cobertura
npm run coverage

# Tests con UI interactiva
npm run test:ui

# Tests en modo watch
npm run test
```

### Cobertura de Código

Los reportes de cobertura se generan en `./coverage/` después de ejecutar `npm run coverage`.

---

## 🚢 Despliegue

### Vercel (Recomendado)

El proyecto incluye configuración para Vercel en `vercel.json`:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Build Manual

```bash
# Generar build de producción
npm run build

# Los archivos se generan en ./dist/
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Código

- Usamos **ESLint** y **Biome** para linting y formateo
- Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/)
- Ejecuta `npm run validate` antes de hacer push

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Equipo

**ARSW - La Ley del Corazón**

---

<div align="center">

**[⬆ Volver arriba](#-maze-rush-frontend)**

</div>
