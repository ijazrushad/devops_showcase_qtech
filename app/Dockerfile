# Use a lightweight Node.js image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]