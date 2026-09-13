FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code and Prisma schema
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client and build typescript
RUN npx prisma generate
RUN npm run build

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
