export dist=~/git/bill-manager/client/dist

sudo apt-get install apache2
sudo cp 000-default.conf /etc/apache2/sites-available
sudo ln -s ${dist} /var/www/html/client
echo 'tmpfs      /var/log/apache2    tmpfs        defaults,noatime           0    0' | sudo tee --append /etc/fstab
sudo service apache2 restart