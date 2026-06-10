FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY . .
RUN chmod +x gradlew && ./gradlew :app:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/app/build/libs/*.jar app.jar
EXPOSE 9811
ENTRYPOINT ["java", "-jar", "app.jar"]

