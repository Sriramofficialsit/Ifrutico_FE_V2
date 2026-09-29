sudo rm -rf ./dist
echo "Deleted da deiiiiiiii...."
npm run build
sudo systemctl reload nginx
echo "Nginx reloaded."
