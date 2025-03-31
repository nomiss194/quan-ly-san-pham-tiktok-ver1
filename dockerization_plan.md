# Kế hoạch Docker hóa ứng dụng TikTok Product Manager (với Nginx)

## 1. Lựa chọn đã xác nhận

*   **Node.js:** `v22` (Giống môi trường local)
*   **PostgreSQL:** `v17` (Giống môi trường local)
*   **Reverse Proxy:** `Nginx` (Sử dụng image `nginx:stable-alpine`)
*   **Quản lý biến môi trường:** Sử dụng file `.env.docker` riêng biệt, đặt trong thư mục `tiktok-product-manager` và thêm vào `.gitignore`.
*   **Lưu trữ dữ liệu (trên VPS):**
    *   Database: `/opt/tiktok_manager/data/db` (Map vào volume của container Postgres)
    *   Uploads: `/opt/tiktok_manager/data/uploads` (Map vào volume của container Node.js và Nginx)
*   **Truy cập:** Qua Nginx trên port 80 (HTTP).

## 2. Cấu trúc file cần tạo

```
e:/code/quan-ly-san-pham-tiktok-ver1/
├── docker-compose.yml
├── nginx.conf                # Cấu hình Nginx
├── tiktok-product-manager/
│   ├── Dockerfile            # Cho ứng dụng Node.js
│   ├── .env.docker           # Biến môi trường (Thêm vào .gitignore)
│   ├── docker-entrypoint.sh  # Script khởi động container Node.js
│   ├── wait-for-it.sh        # Script chờ DB sẵn sàng
│   ├── client/               # Mã nguồn Frontend (Nginx đọc)
│   ├── server/
│   │   └── public/
│   │       └── uploads/      # Nơi Node.js lưu file upload (Nginx đọc)
│   ├── config/
│   ├── ... (các file và thư mục khác của dự án)
│   └── package.json
└── .gitignore
```

## 3. Nội dung chi tiết các file

### `tiktok-product-manager/Dockerfile`

```dockerfile
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
COPY wait-for-it.sh docker-entrypoint.sh ./
RUN chmod +x wait-for-it.sh docker-entrypoint.sh

# Expose port mà ứng dụng Node.js lắng nghe
EXPOSE 3000

# Định nghĩa entrypoint để chạy script khởi động
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]

# Lệnh mặc định (có thể bỏ qua nếu entrypoint đã gọi node)
# CMD [ "node", "server/server.js" ]
```
*(**Lưu ý:** Cần tạo file `.dockerignore` trong `tiktok-product-manager` để tối ưu build image, ví dụ:)*
```
node_modules
.git
.env
.env.docker
*.md
```

### `docker-compose.yml` (Đặt ở thư mục gốc `e:/code/quan-ly-san-pham-tiktok-ver1/`)

```yaml
version: '3.9'

services:
  db:
    image: postgres:17-alpine # Sử dụng phiên bản Alpine nhẹ hơn
    container_name: tiktok_db
    restart: always
    env_file:
      - ./tiktok-product-manager/.env.docker # Lấy biến POSTGRES_* từ đây
    volumes:
      - db_data:/var/lib/postgresql/data # Sử dụng named volume quản lý bởi Docker
    networks:
      - tiktok-net
    healthcheck:
        test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
        interval: 10s
        timeout: 5s
        retries: 5

  app:
    build:
      context: ./tiktok-product-manager
      dockerfile: Dockerfile
    container_name: tiktok_app
    restart: always
    depends_on:
      db:
        condition: service_healthy # Chờ DB healthcheck thành công
    env_file:
      - ./tiktok-product-manager/.env.docker # Lấy biến DB_* và JWT_SECRET từ đây
    volumes:
      - uploads_data:/usr/src/app/server/public/uploads # Sử dụng named volume
    networks:
      - tiktok-net
    # Không expose port ra ngoài, Nginx sẽ xử lý

  nginx:
    image: nginx:stable-alpine
    container_name: tiktok_nginx
    restart: always
    depends_on:
      - app
    ports:
      - "80:80" # Map port 80 của host vào port 80 của Nginx
      # - "443:443" # Sẵn sàng cho HTTPS sau này
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro # Map file cấu hình Nginx
      - ./tiktok-product-manager/client:/usr/share/nginx/html/client:ro # Map thư mục client
      - uploads_data:/usr/share/nginx/html/uploads:ro # Map volume uploads (read-only cho Nginx)
      # - ./certs:/etc/nginx/certs:ro # Sẵn sàng cho SSL certs sau này
    networks:
      - tiktok-net

networks:
  tiktok-net:
    driver: bridge

volumes:
  db_data: # Volume lưu dữ liệu PostgreSQL
    driver: local
    driver_opts:
      type: 'none'
      o: 'bind'
      device: '/opt/tiktok_manager/data/db' # Đường dẫn trên host VPS
  uploads_data: # Volume lưu file uploads
    driver: local
    driver_opts:
      type: 'none'
      o: 'bind'
      device: '/opt/tiktok_manager/data/uploads' # Đường dẫn trên host VPS

```

### `tiktok-product-manager/.env.docker`

```dotenv
# App Config
NODE_ENV=production
PORT=3000 # Port nội bộ của container Node.js
JWT_SECRET=YOUR_STRONG_PRODUCTION_JWT_SECRET # !!! THAY BẰNG SECRET MẠNH !!!

# Database Connection for App
DB_HOST=db # Tên service của database trong docker-compose
DB_PORT=5432
DB_USER=tiktok_user # Ví dụ, có thể thay đổi
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD # !!! THAY BẰNG MẬT KHẨU MẠNH !!!
DB_NAME=tiktok_manager_db # Ví dụ, có thể thay đổi
DB_DIALECT=postgres

# PostgreSQL Service Config (Phải khớp với DB_USER, DB_PASSWORD, DB_NAME ở trên)
POSTGRES_USER=tiktok_user
POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD
POSTGRES_DB=tiktok_manager_db
```
*(**Quan trọng:** File này chứa thông tin nhạy cảm, cần được thêm vào `.gitignore` và tạo thủ công trên VPS với các giá trị production thực tế.)*

### `tiktok-product-manager/wait-for-it.sh`

*(Nội dung chuẩn của script `wait-for-it.sh`, có thể tìm thấy trên GitHub: [https://github.com/vishnubob/wait-for-it](https://github.com/vishnubob/wait-for-it))*
```bash
#!/bin/sh
# wait-for-it.sh script content goes here
# ... (copy the content from the link above) ...
echo "wait-for-it.sh: placeholder - copy content from https://github.com/vishnubob/wait-for-it"
exit 1 # Remove this line after copying content
```

### `tiktok-product-manager/docker-entrypoint.sh`

```bash
#!/bin/sh
set -e

# Chờ database sẵn sàng
# Sử dụng biến môi trường từ .env.docker đã được load vào container
echo "Waiting for database at $DB_HOST:$DB_PORT..."
./wait-for-it.sh "$DB_HOST:$DB_PORT" --timeout=60 --strict -- echo "Database is up"

# Chạy database migrations
echo "Running database migrations..."
npx sequelize-cli db:migrate

# Khởi động ứng dụng Node.js
echo "Starting Node.js application..."
exec node server/server.js
```

### `nginx.conf` (Đặt ở thư mục gốc `e:/code/quan-ly-san-pham-tiktok-ver1/`)

```nginx
upstream backend {
    # Trỏ đến service 'app' trên port 3000 (port nội bộ của container Node.js)
    server app:3000;
}

server {
    listen 80;
    server_name _; # Nghe trên mọi tên miền/IP cho port 80

    # Cấu hình client max body size (quan trọng cho upload file)
    client_max_body_size 50M; # Cho phép upload tối đa 50MB, điều chỉnh nếu cần

    # Phục vụ file tĩnh từ thư mục client đã mount
    location / {
        root /usr/share/nginx/html/client;
        try_files $uri $uri/ /index.html; # SPA fallback
        expires 1h; # Cache file tĩnh trong 1 giờ
        add_header Cache-Control "public";
    }

    # Phục vụ file ảnh đã upload từ thư mục uploads đã mount
    location /uploads/ {
        alias /usr/share/nginx/html/uploads/;
        try_files $uri =404;
        expires 1d; # Cache ảnh trong 1 ngày
        add_header Cache-Control "public";
    }

    # Chuyển tiếp các yêu cầu API đến backend Node.js
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s; # Tăng timeout nếu có request API chạy lâu
        proxy_connect_timeout 75s;
        proxy_cache_bypass $http_upgrade;
    }

    # Tối ưu hóa gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000; # Chỉ gzip file lớn hơn 1KB
    gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Logging (tùy chỉnh nếu cần)
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}

# Có thể thêm server block khác cho HTTPS (listen 443 ssl;) sau này
```

### Cập nhật `.gitignore` (Đặt ở thư mục gốc `e:/code/quan-ly-san-pham-tiktok-ver1/`)

```gitignore
# Dependencies
/node_modules/
/tiktok-product-manager/node_modules/

# Environment variables
/.env
/tiktok-product-manager/.env
/tiktok-product-manager/.env.docker

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build output
dist
build

# OS generated files
.DS_Store
Thumbs.db

# Databases (nếu dùng SQLite local)
*.db
*.sqlite
*.sqlite3

# Uploads (nếu không muốn commit)
# /tiktok-product-manager/server/public/uploads/

# IDE/Editor specific
.vscode/
.idea/

# Other
*.iml
*.bak
```

## 4. Sơ đồ kiến trúc Docker

```mermaid
graph TD
    subgraph VPS (Ubuntu + Docker)
        subgraph Docker Network (tiktok-net)
            ServiceNginx[Nginx Service]:::nginxStyle
            ServiceApp[App Service (Node 22)]:::appStyle
            ServiceDB[DB Service (Postgres 17)]:::dbStyle
        end
        HostDBVolume["/opt/tiktok_manager/data/db"] -- Mount (bind) --> DockerDBVolume[db_data]
        HostUploadsVolume["/opt/tiktok_manager/data/uploads"] -- Mount (bind) --> DockerUploadsVolume[uploads_data]

        DockerDBVolume -- Used by --> ServiceDB([/var/lib/postgresql/data])
        DockerUploadsVolume -- Used by (rw) --> ServiceApp([/usr/src/app/server/public/uploads])
        DockerUploadsVolume -- Used by (ro) --> ServiceNginx([/usr/share/nginx/html/uploads])

        HostClientFiles["./tiktok-product-manager/client"] -- Mount (ro) --> ServiceNginx([/usr/share/nginx/html/client])
        HostNginxConf["./nginx.conf"] -- Mount (ro) --> ServiceNginx([/etc/nginx/conf.d/default.conf])

        User -- SSH --> VPS
        User -- HTTP --> HostPort80{Host Port 80}:::portStyle
    end

    HostPort80 -- Map --> ServiceNginx([Port 80])
    ServiceNginx -- Serves Static & Uploads --> User
    ServiceNginx -- Proxies /api/* --> ServiceApp([app:3000])
    ServiceApp -- Connects to --> ServiceDB([db:5432])

    classDef nginxStyle fill:#009639,stroke:#333,color:#fff
    classDef appStyle fill:#68a0f0,stroke:#333,color:#fff
    classDef dbStyle fill:#cc6699,stroke:#333,color:#fff
    classDef portStyle fill:#f9f,stroke:#333,color:#333
```

## 5. Các bước triển khai trên VPS Ubuntu

1.  **Cài đặt Docker & Docker Compose:** Đảm bảo phiên bản mới nhất.
2.  **Clone mã nguồn:** `git clone <your-repo-url>` và `cd <project-directory>`.
3.  **Tạo thư mục lưu trữ:**
    ```bash
    sudo mkdir -p /opt/tiktok_manager/data/db
    sudo mkdir -p /opt/tiktok_manager/data/uploads
    # Cấp quyền cho user sẽ chạy docker-compose (thường là user hiện tại)
    sudo chown -R $USER:$USER /opt/tiktok_manager/data
    ```
4.  **Tạo file `.env.docker`:**
    *   `cp tiktok-product-manager/.env.example tiktok-product-manager/.env.docker` (Nếu bạn tạo file example)
    *   Hoặc tạo mới: `nano tiktok-product-manager/.env.docker`
    *   Điền các giá trị production thực tế (đặc biệt là `JWT_SECRET` và `DB_PASSWORD`).
5.  **Tạo file `nginx.conf`:** Đảm bảo file `nginx.conf` tồn tại ở thư mục gốc với nội dung đã cung cấp.
6.  **Tạo/Lấy script `wait-for-it.sh`:** Đặt vào `tiktok-product-manager/`.
7.  **Build Docker images:**
    ```bash
    docker-compose build
    ```
8.  **Khởi chạy containers:**
    ```bash
    docker-compose up -d
    ```
9.  **Kiểm tra logs:**
    ```bash
    docker-compose logs -f nginx app db
    ```
    (Nhấn `Ctrl+C` để thoát xem logs). Đảm bảo Nginx khởi động, DB healthy, và `app` chạy migrations thành công và lắng nghe.
10. **Truy cập ứng dụng:** Mở trình duyệt và truy cập `http://<IP_VPS_CUA_BAN>` (sử dụng port 80 mặc định).

## 6. Các lệnh Docker Compose hữu ích khác

*   `docker-compose down`: Dừng và xóa containers, networks (không xóa volumes).
*   `docker-compose down -v`: Dừng và xóa containers, networks, **và named volumes** (cẩn thận!).
*   `docker-compose ps`: Xem trạng thái các containers.
*   `docker-compose exec app bash`: Truy cập vào shell của container `app`.
*   `docker-compose exec db psql -U tiktok_user -d tiktok_manager_db`: Truy cập vào psql của container `db`.

---
Kế hoạch đã được cập nhật và ghi vào file `dockerization_plan.md`.