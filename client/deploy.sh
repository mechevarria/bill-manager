export dist=~/git/bill-manager/client/dist

sudo cp 000-default.conf /etc/apache2/sites-available
sudo ln -s ${dist} /var/www/html/client
sudo service apache2 restart