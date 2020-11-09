FROM openjdk:11.0.9

WORKDIR /grails-api

COPY . .

RUN ./grailsw assemble

EXPOSE 8080

CMD ["java", "-jar", "/grails-api/build/libs/grails-api-0.1.jar"]