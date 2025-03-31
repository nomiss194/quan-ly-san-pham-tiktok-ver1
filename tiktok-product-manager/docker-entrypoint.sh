#!/bin/sh
set -e

# Chờ database sẵn sàng
# Sử dụng biến môi trường từ .env.docker đã được load vào container
echo "Waiting for database at $DB_HOST:$DB_PORT..."
# Giả sử wait-for-it.sh nằm cùng thư mục
# Thay thế wait-for-it.sh bằng vòng lặp nc
while ! nc -z $DB_HOST $DB_PORT; do
  echo "Waiting for database connection..."
  sleep 1
done
echo "Database is up!"

# Chạy database migrations
echo "Running database migrations..."
# Sử dụng npx để chạy sequelize-cli đã cài trong node_modules
# Đảm bảo NODE_ENV=production để sử dụng cấu hình production nếu cần
npx sequelize-cli db:migrate --env production

# Khởi động ứng dụng Node.js
echo "Starting Node.js application..."
exec node server/server.js