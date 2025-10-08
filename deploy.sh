#!/bin/bash

pm2 stop all

# Faz o pull da branch master
echo "Fazendo pull da branch master... API"
git pull

echo "Pull API concluído."

yarn

cd ../arena_webapp


echo "Fazendo pull da branch master APP..."

git pull

echo "Pull APP concluído."

pm2 start all

echo "Deploy concluído."
