export dist=~/git/bill-manager/client/dist

sudo apt-get install apache2
sudo a2enmod proxy
sudo cp 000-default.conf /etc/apache2/sites-available
sudo ln -s ${dist} /var/www/html/client
sudo service apache2 restart
