# Use Node.js 20 alpine image (compatible with Vite 7)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Build the application
RUN npm run build

# Expose port 4173 (Vite preview port)
EXPOSE 4173

# Serve the built application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
