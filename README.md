# Documentador

Este repositorio tiene dos partes:

- `Backend/`: API en `Fastify` y PostgreSQL.
- `Frontend/`: aplicación `Next.js` que consume la API.

## Integración local front + back

El frontend usa la variable de entorno `NEXT_PUBLIC_API_URL` para conectarse al backend.

### 1. Backend

1. Abrir terminal en `Backend/`
2. Ejecutar `npm install`
3. Crear `.env` desde el ejemplo:
   ```bash
   cp .env.example .env
   ```
4. Ajustar las variables en `.env` si es necesario.
5. Levantar la infraestructura con Docker:
   ```bash
   docker compose up -d
   ```
6. Ejecutar migraciones y seed:
   ```bash
   npm run migrate
   npm run seed
   ```
7. Arrancar el backend:
   ```bash
   npm run dev
   ```

El backend quedará disponible en `http://localhost:3001`.

### 2. Frontend

1. Abrir terminal en `Frontend/`
2. Ejecutar `npm install`
3. Crear `.env.local` desde el ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```
4. Verificar que `NEXT_PUBLIC_API_URL` apunte a `http://localhost:3001`.
5. Iniciar la aplicación Next.js:
   ```bash
   npm run dev
   ```

El frontend quedará disponible en `http://localhost:3000` y consumirá la API en `http://localhost:3001`.

> Si Next.js inicia en otro puerto local por conflicto, ajusta `CORS_ORIGIN` en el backend a la URL correcta o usa `http://localhost:<puerto>`.

## Nota sobre CORS

El backend ya está configurado para aceptar peticiones desde `http://localhost:3000` de forma predeterminada.

## Verificación rápida

- Backend: `http://localhost:3001/health`
- Frontend: `http://localhost:3000`
