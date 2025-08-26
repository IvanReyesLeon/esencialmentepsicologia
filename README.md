# Esencialmente Psicología - Website

Una aplicación web completa para el centro de psicología "Esencialmente Psicología" con un panel de administración para gestionar terapeutas y precios.

## Características

### Frontend (Cliente)
- **Página de Inicio**: Presentación del centro y servicios
- **Terapeutas**: Lista de profesionales con sus especialidades
- **Servicios**: Información detallada de servicios y precios
- **Contacto**: Formulario de contacto con envío de email y mapa de ubicación
- **Panel de Administración**: Gestión completa de terapeutas y precios
- **Diseño Responsivo**: Optimizado para móviles y tablets

### Backend (Servidor)
- **API RESTful**: Endpoints para gestión de datos
- **Autenticación JWT**: Sistema seguro para administradores
- **Base de Datos MongoDB**: Almacenamiento de terapeutas, precios y usuarios
- **Envío de Emails**: Sistema de contacto con Nodemailer
- **Middleware de Seguridad**: Protección de rutas administrativas

## Estructura del Proyecto

```
psychology-clinic/
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── services/      # API calls
│   │   └── App.js
│   └── package.json
├── server/                # Backend Node.js
│   ├── config/
│   ├── controllers/       # Lógica de negocio
│   ├── middleware/        # Middleware personalizado
│   ├── models/           # Modelos de MongoDB
│   ├── routes/           # Rutas de la API
│   ├── .env              # Variables de entorno
│   ├── package.json
│   └── server.js
└── README.md
```

## Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- MongoDB (local o MongoDB Atlas)
- Cuenta de Gmail para envío de emails

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias del servidor
cd server
npm install

# Instalar dependencias del cliente
cd ../client
npm install
```

### 2. Configurar variables de entorno

Edita el archivo `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/psychology_clinic
JWT_SECRET=tu_clave_secreta_jwt_muy_segura
NODE_ENV=development

# Configuración de email
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
CLINIC_EMAIL=info@esencialmentepsicologia.com
```

**Nota**: Para Gmail, necesitas generar una "Contraseña de aplicación" en tu cuenta de Google.

### 3. Configurar MongoDB

#### Opción A: MongoDB Local
```bash
# Instalar MongoDB Community Edition
# Iniciar el servicio MongoDB
mongod
```

#### Opción B: MongoDB Atlas (Recomendado)
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear un cluster gratuito
3. Obtener la cadena de conexión
4. Actualizar `MONGODB_URI` en `.env`

### 4. Crear usuario administrador

Ejecuta este script para crear el primer usuario administrador:

```bash
cd server
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const admin = new User({
      username: 'admin',
      email: 'admin@esencialmentepsicologia.com',
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('Usuario administrador creado');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
"
```

## Ejecución

### Desarrollo

```bash
# Terminal 1: Servidor (Puerto 5000)
cd server
npm run dev

# Terminal 2: Cliente (Puerto 3000)
cd client
npm start
```

### Producción

```bash
# Construir cliente
cd client
npm run build

# Ejecutar servidor
cd ../server
npm start
```

## Uso

### Acceso Público
- **URL**: http://localhost:3000
- **Páginas**: Inicio, Terapeutas, Servicios, Contacto

### Panel de Administración
- **URL**: http://localhost:3000/admin
- **Credenciales por defecto**:
  - Email: admin@esencialmentepsicologia.com
  - Contraseña: admin123

### Funcionalidades del Admin
1. **Gestión de Terapeutas**:
   - Crear nuevos terapeutas
   - Editar información existente
   - Desactivar terapeutas
   - Gestionar especialidades y tipos de sesión

2. **Gestión de Precios**:
   - Configurar precios por tipo de sesión
   - Actualizar duraciones
   - Modificar descripciones

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Terapeutas
- `GET /api/therapists` - Listar terapeutas (público)
- `POST /api/therapists` - Crear terapeuta (admin)
- `PUT /api/therapists/:id` - Actualizar terapeuta (admin)
- `DELETE /api/therapists/:id` - Eliminar terapeuta (admin)

### Precios
- `GET /api/pricing` - Listar precios (público)
- `POST /api/pricing` - Crear/actualizar precio (admin)
- `DELETE /api/pricing/:id` - Eliminar precio (admin)

### Contacto
- `POST /api/contact` - Enviar mensaje de contacto (público)

## Personalización

### Cambiar Información del Centro
1. Editar `client/src/components/Footer.js` - Información de contacto
2. Editar `client/src/pages/Contact.js` - Datos de contacto y mapa
3. Actualizar variables de entorno para emails

### Modificar Mapa
En `client/src/pages/Contact.js`, actualiza el `src` del iframe con las coordenadas reales:
```javascript
src="https://www.google.com/maps/embed?pb=TUS_COORDENADAS_AQUI"
```

### Cambiar Colores y Estilos
Los colores principales están definidos en los archivos CSS:
- Verde principal: `#2c5f41`
- Verde oscuro: `#1a3d2e`
- Verde claro: `#a8d5ba`

## Despliegue

### Netlify (Frontend)
1. Construir el proyecto: `cd client && npm run build`
2. Subir la carpeta `build` a Netlify
3. Configurar variables de entorno: `REACT_APP_API_URL`

### Heroku (Backend)
1. Crear app en Heroku
2. Configurar variables de entorno
3. Conectar repositorio Git
4. Desplegar

### MongoDB Atlas
Recomendado para producción en lugar de MongoDB local.

## Soporte

Para soporte técnico o preguntas sobre la implementación, contacta con el desarrollador.

## Licencia

Este proyecto fue desarrollado específicamente para Esencialmente Psicología.
