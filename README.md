# 💸 Backend Fintech Gamificada

Backend de una aplicación **fintech enfocada en finanzas personales gamificadas**, desarrollada en **Node.js con TypeScript**.

## 🎯 Características Principales

- 🔐 **Autenticación JWT** con refresh tokens
- 👤 **Gestión de usuarios** con perfiles financieros
- 💰 **Transacciones** manuales y automáticas (Belvo)
- 🎁 **Sistema de recompensas** gamificado
- 🔔 **Notificaciones** configurables
- 💬 **Chat en tiempo real** (WebSocket) con IA y agentes humanos
- 🤖 **IA integrada** para análisis financiero y recomendaciones
- 🎯 **Metas de ahorro** con seguimiento y sugerencias de IA
- 🗄️ **Database Factory** - Agnóstico a la base de datos (PostgreSQL, Supabase, Firebase)

## 🧱 Stack Tecnológico

- **Node.js** + **TypeScript**
- **Express.js** para API REST
- **WebSocket** (ws) para chat en tiempo real
- **JWT** para autenticación
- **Winston** para logging estructurado
- **Bcrypt** para hash de contraseñas
- **Factory Pattern** para:
  - Bases de datos (PostgreSQL, Supabase, Firebase)
  - Integraciones financieras (Belvo, Plaid)
  - Modelos de IA (OpenAI, Anthropic, Local)

## 📦 Módulos

### 1. `auth`
- Registro y login
- JWT + refresh tokens
- Middleware de autenticación
- Roles: `user`, `admin`, `agent`

### 2. `users`
- CRUD de usuario
- Perfil financiero (edad, ingresos, metas)
- Preferencias de notificación
- Configuración de privacidad

### 3. `transactions`
- Registro manual de ingresos/gastos
- Categorización automática con IA
- Integración con Belvo (mock inicial)
- Estadísticas y análisis

### 4. `rewards`
- Sistema de puntos gamificado
- Catálogo de premios
- Redención de recompensas
- Puntos por ahorro y logros

### 5. `notifications`
- Alertas configurables
- Notificaciones de logros
- Recordatorios de ahorro
- Mock inicial (console.log)

### 6. `chat`
- WebSocket para chat en tiempo real
- Chat con IA (análisis financiero)
- Chat con agentes humanos
- Historial persistente

### 7. `ai`
- **AIModelFactory**: OpenAI, Anthropic, Local
- **AIAgentService**: Procesamiento de mensajes
- **AIToolsService**: Herramientas analíticas
  - Categorización automática
  - Predicción de gastos
  - Análisis de hábitos
  - Detección de anomalías
  - Recomendaciones personalizadas
- **AIWorker**: Tareas programadas (análisis nocturnos)

### 8. `goals`
- Metas de ahorro con seguimiento
- Contribuciones y progreso
- Sugerencias de metas con IA
- Recompensas al completar metas

### 9. `database`
- **DatabaseFactory**: Abstracción de base de datos
- **PostgreSQLProvider**: Implementación para PostgreSQL (con mock)
- **SupabaseProvider**: Implementación para Supabase
- **FirebaseProvider**: Implementación para Firebase Firestore

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ y npm
- (Opcional) PostgreSQL / Supabase / Firebase según configuración

### Pasos

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd fintech/backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_PROVIDER=postgres
DATABASE_URL=postgresql://user:pass@localhost:5432/fintech

# Supabase (si usas Supabase)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your_supabase_key

# Firebase (si usas Firebase)
FIREBASE_CREDENTIALS=./firebase.json

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Integraciones (mock por defecto)
BELVO_API_KEY=mock
OPENAI_API_KEY=mock
ANTHROPIC_API_KEY=mock
```

4. **Compilar TypeScript**
```bash
npm run build
```

5. **Iniciar servidor**

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

## 📡 API Endpoints

### Autenticación
```
POST   /auth/register     - Registro de usuario
POST   /auth/login        - Login
POST   /auth/refresh      - Refrescar token
GET    /auth/me           - Info del usuario autenticado
```

### Usuarios
```
GET    /users/me                  - Obtener perfil
PUT    /users/me                  - Actualizar perfil
DELETE /users/me                  - Eliminar cuenta
GET    /users/me/profile          - Perfil financiero
PUT    /users/me/profile          - Actualizar perfil financiero
GET    /users/me/notifications    - Preferencias de notificación
PUT    /users/me/notifications    - Actualizar preferencias
GET    /users/me/privacy          - Configuración de privacidad
PUT    /users/me/privacy          - Actualizar privacidad
```

### Transacciones
```
GET    /transactions              - Listar transacciones
POST   /transactions              - Crear transacción
GET    /transactions/:id          - Obtener transacción
PUT    /transactions/:id          - Actualizar transacción
DELETE /transactions/:id          - Eliminar transacción
POST   /transactions/sync         - Sincronizar con Belvo
GET    /transactions/stats        - Estadísticas
```

### Recompensas
```
GET    /rewards/catalog           - Catálogo de premios
GET    /rewards/catalog/:id       - Detalle de premio
GET    /rewards/points            - Puntos del usuario
GET    /rewards/points/history    - Historial de puntos
POST   /rewards/redeem/:id        - Redimir premio
GET    /rewards/redemptions       - Mis redenciones
```

### Notificaciones
```
GET    /notifications             - Listar notificaciones
PUT    /notifications/:id/read    - Marcar como leída
PUT    /notifications/read-all    - Marcar todas como leídas
DELETE /notifications/:id         - Eliminar notificación
```

### Chat
```
GET    /chat/sessions             - Mis sesiones de chat
POST   /chat/sessions             - Crear sesión
POST   /chat/sessions/:id/close   - Cerrar sesión
GET    /chat/sessions/:id/history - Historial de mensajes
GET    /chat/agents               - Agentes disponibles

# WebSocket
ws://localhost:3001?token=<JWT>&type=ai     - Chat con IA
ws://localhost:3001?token=<JWT>&type=human  - Chat con agente
```

### IA
```
POST   /ai/chat                   - Chat con IA (REST)
GET    /ai/chat/history           - Historial de chat
DELETE /ai/chat/history           - Limpiar historial
POST   /ai/analyze                - Análisis financiero
POST   /ai/recommend              - Recomendaciones
POST   /ai/predict                - Predicción de gastos
POST   /ai/categorize             - Categorización automática
POST   /ai/anomalies              - Detección de anomalías
```

### Metas
```
GET    /goals                     - Listar metas
POST   /goals                     - Crear meta
GET    /goals/:id                 - Obtener meta
PUT    /goals/:id                 - Actualizar meta
DELETE /goals/:id                 - Eliminar meta
POST   /goals/:id/contribute      - Contribuir a meta
GET    /goals/:id/progress        - Progreso de meta
GET    /goals/:id/contributions   - Contribuciones
GET    /goals/suggest             - Sugerencias con IA
```

## 🏗️ Arquitectura

```
src/
├─ modules/              # Módulos de negocio
│   ├─ auth/            # Autenticación y autorización
│   ├─ users/           # Gestión de usuarios
│   ├─ transactions/    # Transacciones financieras
│   ├─ rewards/         # Sistema de recompensas
│   ├─ notifications/   # Sistema de notificaciones
│   ├─ chat/            # Chat en tiempo real
│   ├─ ai/              # Inteligencia artificial
│   ├─ goals/           # Metas de ahorro
│   └─ database/        # Database Factory
├─ factory/             # Factories de integraciones
├─ config/              # Configuración
├─ utils/               # Utilidades (logger, etc.)
├─ app.ts               # Configuración Express
└─ server.ts            # Punto de entrada
```

## 🔧 Configuración Avanzada

### Cambiar Base de Datos

En `.env`, modifica:
```env
DB_PROVIDER=supabase  # o 'firebase' o 'postgres'
```

El sistema automáticamente usará el provider configurado gracias al **DatabaseFactory**.

### Cambiar Modelo de IA

En el código, puedes cambiar el modelo:
```typescript
const aiAgent = new AIAgentService('anthropic'); // o 'openai' o 'local'
```

### Habilitar Integraciones Reales

1. **Belvo**: Obtén API key en [belvo.com](https://belvo.com)
2. **OpenAI**: Obtén API key en [platform.openai.com](https://platform.openai.com)
3. Actualiza `.env` con las claves reales
4. Actualiza las implementaciones para usar los SDKs reales

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test
```

## 📝 Logs

Los logs se guardan en:
- `logs/error.log` - Solo errores
- `logs/combined.log` - Todos los logs

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT con expiración configurable
- Helmet.js para headers de seguridad
- CORS configurado
- Validación de entrada en todos los endpoints

## 🚧 Próximos Pasos

- [ ] Conectar APIs reales (Belvo, OpenAI)
- [ ] Implementar tests unitarios y de integración
- [ ] Añadir almacenamiento cifrado para datos sensibles
- [ ] Desarrollar dashboard admin
- [ ] Integrar con comercios reales para recompensas
- [ ] Mejorar modelos de ML para predicción

## 📄 Licencia

ISC

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría realizar.

---

**¡Hecho con ❤️ y TypeScript!**

