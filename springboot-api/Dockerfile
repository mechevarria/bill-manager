FROM openjdk:11.0.9.1

WORKDIR /app

COPY . .

RUN ./mvnw -DskipTests package

EXPOSE 8080

CMD ["java", "-Xms128m", "-jar", "./target/springboot-api-0.1.2-SNAPSHOT.jar"]