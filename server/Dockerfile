# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port that the application listens on
EXPOSE 5000

# Define the command to run the application
CMD ["npm", "start"]
