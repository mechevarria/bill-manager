#!/bin/bash
sudo cp interfaces /etc/network/
sudo cp NetworkManager.conf /etc/NetworkManager/ 
sudo systemctl restart network-manager
