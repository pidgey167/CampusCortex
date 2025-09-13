# ==============================
# Base image for Node.js
# ==============================
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ==============================
# Backend Build
# ==============================
FROM base AS backend-build

# Copy backend dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install 

# Copy backend source
COPY backend ./

# Expose backend port
EXPOSE 5000

# Start backend
CMD ["npm", "run", "dev"]

# ==============================
# Frontend Build
# ==============================
FROM base AS frontend-build

# Copy frontend dependencies
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source
COPY frontend ./

# Build the Next.js app
# RUN npm run build

# Expose frontend port
EXPOSE 3000

# Start frontend
CMD ["npm", "run", "dev"]