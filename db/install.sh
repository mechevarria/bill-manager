sudo apt-get install mysql-server mysql-workbench
mysql -u root -p < config.sql
sudo update-rc.d mysql defaults
