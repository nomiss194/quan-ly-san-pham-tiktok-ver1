# Kế hoạch Tối ưu Hiệu năng cho Dữ liệu Lớn

**Mục tiêu:** Cải thiện tốc độ phản hồi của ứng dụng, đặc biệt khi lọc và sắp xếp, và đảm bảo khả năng mở rộng khi số lượng sản phẩm tăng lên.

**Các Bước Thực Hiện:**

**Bước 1: Tối ưu hóa Frontend - Loại bỏ N+1 Query khi Lọc theo Tag**

*   **Phân tích:** Khối code trong `tiktok-product-manager/client/js/modules/dataLoaders.js` (dòng 21-38) thực hiện gọi API bổ sung cho từng sản phẩm khi lọc theo tag. Phân tích lại `productController.js` cho thấy API `/api/products` đã trả về đầy đủ thông tin tag cần thiết thông qua `include: [{ model: Tag }]`, ngay cả khi có bộ lọc tag. Do đó, các lệnh gọi API bổ sung này là không cần thiết và gây ra vấn đề N+1.
*   **Hành động:** Xóa bỏ khối `if (filters.tags) { ... }` trong hàm `loadProductsList` tại file `tiktok-product-manager/client/js/modules/dataLoaders.js`. Luôn sử dụng logic `renderProducts(products)` để hiển thị dữ liệu trả về từ lệnh gọi API ban đầu.
*   **Lợi ích:** Giảm đáng kể số lượng yêu cầu mạng khi lọc theo tag, cải thiện tốc độ tải và giảm tải cho server.

    ```mermaid
    sequenceDiagram
        participant F as Frontend (dataLoaders.js)
        participant B as Backend (productController.js)
        participant DB as Database

        Note over F, B: Luồng hiện tại khi lọc theo Tag
        F->>B: GET /api/products?tags=...&page=1&limit=30
        B->>DB: Query products with tag filter (page 1)
        DB-->>B: products[30] (with tags)
        B-->>F: { products: [...] }
        loop For each product in response
            F->>B: GET /api/products/{product.id}
            B->>DB: Query product by ID (with tags)
            DB-->>B: completeProduct
            B-->>F: completeProduct
        end
        F->>F: renderProducts(completeProducts)

        Note over F, B: Luồng đề xuất sau tối ưu
        F->>B: GET /api/products?tags=...&page=1&limit=30
        B->>DB: Query products with tag filter (page 1)
        DB-->>B: products[30] (with tags)
        B-->>F: { products: [...] }
        F->>F: renderProducts(products)
    ```

**Bước 2: Tối ưu hóa Database - Thêm Index cần thiết**

*   **Phân tích:** Dựa trên các truy vấn trong `productController.js`, các cột sau đây thường xuyên được sử dụng trong các mệnh đề `WHERE`, `ORDER BY`, hoặc `JOIN` và cần được đánh index để tăng tốc độ truy vấn với dữ liệu lớn:
    *   **Bảng `Products`:**
        *   `user_id`: Lọc theo người dùng.
        *   `deleted_at`: Lọc sản phẩm đang hoạt động (soft delete).
        *   `purchased`: Lọc theo trạng thái mua.
        *   `created_at`: Lọc theo ngày tạo và sắp xếp.
        *   `video_count`: Lọc theo số lượng video và sắp xếp.
        *   Xem xét index kết hợp: `(user_id, deleted_at)` hoặc `(user_id, deleted_at, purchased)` có thể hiệu quả hơn cho các truy vấn lọc phổ biến.
    *   **Bảng `VideoLogs`:**
        *   `product_id`: Dùng để tính tổng (`sum`) và lấy danh sách log cho sản phẩm.
    *   **Bảng `ProductTags` (Bảng trung gian):**
        *   `(product_id, tag_id)`: Thường đã là khóa chính hoặc có index riêng, nhưng cần kiểm tra lại. Index trên từng cột `product_id` và `tag_id` riêng lẻ cũng rất quan trọng cho các phép JOIN.
*   **Hành động:** Tạo một file migration mới trong Sequelize (ví dụ: `YYYYMMDDHHMMSS-add-indexes-for-performance.js`) để thêm các index cần thiết.
*   **Nội dung Migration đề xuất (Ví dụ):**
    ```javascript
    'use strict';

    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up (queryInterface, Sequelize) {
        // Indexes for Products table
        await queryInterface.addIndex('Products', ['user_id'], { name: 'products_user_id_idx' });
        await queryInterface.addIndex('Products', ['deleted_at'], { name: 'products_deleted_at_idx' }); // Important for soft deletes
        await queryInterface.addIndex('Products', ['purchased'], { name: 'products_purchased_idx' });
        await queryInterface.addIndex('Products', ['created_at'], { name: 'products_created_at_idx' });
        await queryInterface.addIndex('Products', ['video_count'], { name: 'products_video_count_idx' });
        // Consider a composite index for common filtering
        await queryInterface.addIndex('Products', ['user_id', 'deleted_at'], { name: 'products_user_id_deleted_at_idx' });

        // Index for VideoLogs table
        await queryInterface.addIndex('VideoLogs', ['product_id'], { name: 'videologs_product_id_idx' });

        // Indexes for ProductTags junction table (if not already primary/unique keys)
        // Check existing constraints before adding these
        // await queryInterface.addIndex('ProductTags', ['product_id'], { name: 'producttags_product_id_idx' });
        // await queryInterface.addIndex('ProductTags', ['tag_id'], { name: 'producttags_tag_id_idx' });
      },

      async down (queryInterface, Sequelize) {
        await queryInterface.removeIndex('Products', 'products_user_id_idx');
        await queryInterface.removeIndex('Products', 'products_deleted_at_idx');
        await queryInterface.removeIndex('Products', 'products_purchased_idx');
        await queryInterface.removeIndex('Products', 'products_created_at_idx');
        await queryInterface.removeIndex('Products', 'products_video_count_idx');
        await queryInterface.removeIndex('Products', 'products_user_id_deleted_at_idx');
        await queryInterface.removeIndex('VideoLogs', 'videologs_product_id_idx');
        // await queryInterface.removeIndex('ProductTags', 'producttags_product_id_idx');
        // await queryInterface.removeIndex('ProductTags', 'producttags_tag_id_idx');
      }
    };
    ```
    *(Lưu ý: Cần kiểm tra lại tên bảng và cột thực tế trong CSDL của bạn. Các index trên `ProductTags` có thể đã tồn tại nếu `product_id` và `tag_id` là khóa ngoại hoặc phần của khóa chính.)*
*   **Lợi ích:** Tăng tốc độ đáng kể cho các hoạt động đọc dữ liệu (lấy danh sách, lọc, sắp xếp, thống kê), giảm tải cho CSDL và cải thiện trải nghiệm người dùng.

**Bước 3: Kiểm tra và Triển khai**

*   Sau khi áp dụng các thay đổi code và chạy migration, cần kiểm tra lại hiệu năng của ứng dụng, đặc biệt là với các bộ lọc và sắp xếp khác nhau, và khi lọc theo tag.
*   Sử dụng các công cụ giám sát CSDL (nếu có) để xác nhận rằng các index đang được sử dụng hiệu quả.