sudo apt-get install mysql-server mysql-workbench
mysql -u root -p < config.sql
echo 'tmpfs      /var/log/mysql    tmpfs        defaults,noatime           0    0' | sudo tee --append /etc/fstab
sudo update-rc.d mysql defaults