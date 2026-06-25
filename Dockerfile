# Stage 1: Build the application using Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build

# Set the working directory to the root of the project
WORKDIR /app

# Copy both frontend and backend directories
COPY frontend ./frontend
COPY backend ./backend

# Build the backend (which also builds the React frontend via frontend-maven-plugin)
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Stage 2: Create a lightweight runtime image
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the single compiled JAR from the build stage
COPY --from=build /app/backend/target/employee-manager-0.0.1-SNAPSHOT.jar app.jar

# Spring Boot defaults to 8080
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
