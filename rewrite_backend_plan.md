# Kế hoạch viết lại Backend (PostgreSQL & Sequelize)

## 1. Mục tiêu

Viết lại toàn bộ code trong thư mục `tiktok-product-manager/server/` để:
*   Sử dụng **PostgreSQL** làm cơ sở dữ liệu.
*   Sử dụng **Sequelize** làm ORM.
*   Tuân thủ cấu trúc thư mục, schema database và định nghĩa API trong `plan.md`.
*   Đảm bảo các API endpoints hoạt động đúng như mong đợi của `client/js/app.js`.
*   Giữ nguyên phần frontend (`giaodien-new.html` và `client/js/app.js`).

## 2. Sơ đồ quy trình

```mermaid
graph TD
    A[Bắt đầu] --> B{Phân tích yêu cầu & plan.md};
    B --> C{Kiểm tra Frontend (HTML, JS)};
    C --> D{Xác nhận Frontend độc lập & dùng API};
    D --> E[Lập kế hoạch viết lại Backend];
    E --> F[Thiết lập môi trường Backend (PG, Sequelize, .env)];
    F --> G[Viết lại Models & Associations];
    G --> H[Tạo & Chạy Migrations];
    H --> I[Viết lại Controllers & Logic nghiệp vụ];
    I --> J[Viết lại Middleware (Auth)];
    J --> K[Viết lại Routes API];
    K --> L[Cấu hình Express App (server/app.js, server/server.js)];
    L --> M[Kiểm thử Backend API];
    M --> N{Backend hoàn thành & tương thích API};
    N --> O[Giữ nguyên Frontend (HTML, JS)];
    O --> P[Kết thúc];

    subgraph Backend (server/)
        F; G; H; I; J; K; L; M;
    end

    subgraph Frontend (client/)
        C; D; O;
    end
```

## 3. Các bước thực hiện chi tiết (Backend)

1.  **Thiết lập môi trường:**
    *   Cài đặt dependencies: `npm install pg pg-hstore sequelize express jsonwebtoken bcryptjs dotenv cors` (thêm `--save` hoặc `--save-dev` nếu cần).
    *   Cấu hình `.env`: Thêm các biến `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`, `JWT_SECRET`, `PORT`.
    *   Cấu hình Sequelize CLI: Chỉnh sửa `.sequelizerc` và `config/config.json` để sử dụng PostgreSQL và đúng đường dẫn thư mục.

2.  **Models (`server/models/`):**
    *   Viết lại/Tạo các file model (`user.js`, `product.js`, `tag.js`, `product_tags.js`, `goal.js`, `category_goal.js`, `video_log.js`) sử dụng `Sequelize.define`.
    *   Sử dụng `DataTypes` phù hợp với PostgreSQL (tham khảo `plan.md`).
    *   Định nghĩa các mối quan hệ (associations) giữa các model.
    *   Cập nhật `server/models/index.js` để khởi tạo Sequelize với cấu hình PG và import models.

3.  **Migrations (`server/migrations/`):**
    *   Tạo các file migration cho từng bảng theo schema trong `plan.md`.
    *   Sử dụng API của Sequelize migration (`queryInterface.createTable`, `addConstraint`, `addIndex`).
    *   Chạy migrations: `npx sequelize-cli db:migrate`.

4.  **Controllers (`server/controllers/`):**
    *   Viết lại các file controller (`authController.js`, `productController.js`, `tagController.js`, `goalController.js`).
    *   Sử dụng models Sequelize để thực hiện CRUD.
    *   Triển khai logic nghiệp vụ: hashing password, JWT, tính `video_count`, soft delete, upsert (goals, video logs), tính stats.

5.  **Middleware (`server/middleware/`):**
    *   Viết lại/Tạo middleware xác thực JWT (`auth.js`).

6.  **Routes (`server/routes/`):**
    *   Viết lại các file route (`auth.js`, `products.js`, `tags.js`, `goals.js`).
    *   Định nghĩa API endpoints theo `plan.md`, liên kết với controllers và áp dụng middleware.

7.  **Ứng dụng Express:**
    *   Viết lại `server/app.js`: Cấu hình Express, sử dụng middleware, đăng ký routes.
    *   Viết lại `server/server.js`: Khởi tạo Sequelize, chạy server Express.

8.  **Kiểm thử:**
    *   Sử dụng Postman/curl để kiểm tra kỹ lưỡng từng API endpoint.

## 4. Frontend

*   Giữ nguyên các file `giaodien-new.html` và `client/js/app.js`. Đảm bảo backend API trả về đúng định dạng dữ liệu mà frontend mong đợi.