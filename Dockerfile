#use the official OpenJDK 21 base image
FROM openjdk21

WORKDIR /app

COPY expenseService-0.0.1-SNAPSHOT.jar /app/expenseService-0.0.1-SNAPSHOT.jar

EXPOSE 9898

ENTRYPOINT ["java", "-jar", "/app/expenseService-0.0.1-SNAPSHOT.jar"]
