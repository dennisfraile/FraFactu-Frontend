# syntax=docker/dockerfile:1

# Imagen de DESARROLLO: Vite dev server con HMR.
# El endurecimiento para producción (build estático servido por nginx) se hace en F9.
FROM node:22-alpine
WORKDIR /app

# Instalar dependencias primero (cache de capas)
COPY package.json package-lock.json ./
RUN npm ci

# El código se monta como volumen en docker-compose para hot reload;
# se copia también para que la imagen sea ejecutable por sí sola.
COPY . .

ENV CHOKIDAR_USEPOLLING=true
EXPOSE 5173

CMD ["npm", "run", "dev"]
