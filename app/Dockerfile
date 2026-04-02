# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies (production only)
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Set an environment variable (Task Requirement)
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]