#!/bin/bash
echo "Installing DavintoMD Dependencies..."
pkg update && pkg upgrade -y
pkg install nodejs git ffmpeg imagemagick yarn -y
git clone https://github.com/davinto/DavintoMD.git
cd DavintoMD
yarn install
echo "Setup complete! Run 'node index.js' to start."
