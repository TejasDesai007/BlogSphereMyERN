# Use a Node.js base image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port your app runs on (e.g. 5000)
EXPOSE 5000

# Run server.js as entry point
CMD ["node", "server.js"]
