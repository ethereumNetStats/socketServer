#!/bin/bash
sudo docker build -t ethereum_socket_server .
sudo docker save ethereum_socket_server:latest > ethereum_socket_server.tar
sudo docker stop ethereum_socket_server
sudo docker ps -a -q -f name=ethereum_socket_server | xargs sudo docker rm
sudo docker rmi ethereum_socket_server:latest
sudo docker load < ethereum_socket_server.tar
sudo docker run -d --name ethereum_socket_server -p 6000:6000 ethereum_socket_server:latest
