# Imagen base liviana de Node.js 18 en Alpine
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Puerto que expone la aplicación
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]