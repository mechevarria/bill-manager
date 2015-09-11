bak=grails-api.bak
api=grails-api

mv ${api} ${bak}
grails create-app ${api} --profile=web-api

###
printf '\nwar {\n  archiveName = "api.war"\n  destinationDir = file("../")\n}' >> ${api}/build.gradle

search='compile "org.springframework.boot:spring-boot-starter-tomcat"'
replace='provided "org.springframework.boot:spring-boot-starter-tomcat"'
sed -i "s@${search}@${replace}@g" ${api}/build.gradle

search='runtime "com.h2database:h2"'
replace=${search}'\n    runtime "mysql:mysql-connector-java:5.1.36"'
sed -i "s@${search}@${replace}@g" ${api}/build.gradle

###
cp ${bak}/grails-app/conf/*.* ${api}/grails-app/conf

###
mkdir ${api}/grails-app/controllers/api
cp ${bak}/grails-app/controllers/api/*.* ${api}/grails-app/controllers/api

###
mkdir ${api}/grails-app/domain/api
cp ${bak}/grails-app/domain/api/*.* ${api}/grails-app/domain/api

###
cp ${bak}/grails-app/init/BootStrap.groovy ${api}/grails-app/init/BootStrap.groovy