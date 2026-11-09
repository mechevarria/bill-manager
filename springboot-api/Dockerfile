FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B
COPY src ./src
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:25-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/target/springboot-api-*.jar app.jar
USER app
EXPOSE 8080
CMD ["java", \
  "-Xms128m", "-Xmx512m", \
  "-XX:+UseCompactObjectHeaders", \
  "-XX:TieredStopAtLevel=1", \
  "-XX:+UseSerialGC", \
  "-jar", "app.jar"]
