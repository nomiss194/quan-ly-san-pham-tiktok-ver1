# Sử dụng base image Node.js v22
FROM node:22-alpine

# Tạo thư mục ứng dụng
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt chỉ các dependencies cần cho production
# Sử dụng npm ci để cài đặt chính xác từ package-lock.json
RUN npm ci --only=production

# Sao chép mã nguồn ứng dụng
# Sử dụng .dockerignore để loại trừ node_modules, .git, .env, etc.
COPY . .

# Sao chép các script hỗ trợ và cấp quyền thực thi
# Chỉ sao chép docker-entrypoint.sh và cấp quyền
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port mà ứng dụng Node.js lắng nghe
EXPOSE 3000

# Định nghĩa entrypoint để chạy script khởi động
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]

# Lệnh mặc định (có thể bỏ qua nếu entrypoint đã gọi node)
# CMD [ "node", "server/server.js" ]