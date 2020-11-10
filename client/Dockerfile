# run using nginx
FROM nginx

COPY default.conf /etc/nginx/conf.d/

COPY ./dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]