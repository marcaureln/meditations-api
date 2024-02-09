ARG NODE_VERSION=20.11.0

# Use the node image as the base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set the working directory for all build stages.
WORKDIR /app

# Set the node environment to development.
ENV NODE_ENV development

# Copy the package.json file to enable package manager commands.
COPY package.json .

# Install dependencies using the package manager.
RUN yarn install

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application in development mode.
CMD yarn start:dev
