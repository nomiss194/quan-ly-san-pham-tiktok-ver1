# Kế hoạch thực hiện chức năng phân trang

**Yêu cầu:** Thêm chức năng phân trang cho danh sách sản phẩm, hiển thị 30 sản phẩm mỗi trang. Việc lọc phải áp dụng trên toàn bộ sản phẩm.

## 1. Backend (Server)

*   **Mục tiêu:** Sửa đổi API lấy danh sách sản phẩm (`/api/products`) để chấp nhận tham số phân trang (`page`, `limit`) và trả về cả danh sách sản phẩm cho trang hiện tại lẫn tổng số sản phẩm khớp với bộ lọc.
*   **Các bước:**
    *   **Cập nhật `tiktok-product-manager/server/controllers/productController.js` (hàm `getAllProducts`):**
        *   Nhận thêm tham số `page` (số trang, mặc định là 1) và `limit` (số sản phẩm mỗi trang, mặc định là 30) từ `req.query`.
        *   Tính toán `offset` dựa trên `page` và `limit` (`offset = (page - 1) * limit`).
        *   Sử dụng `Product.findAndCountAll` thay vì `findAll`. Hàm này sẽ trả về cả danh sách sản phẩm cho trang hiện tại (`rows`) và tổng số sản phẩm khớp với điều kiện `where` *trước khi* áp dụng `limit` và `offset` (`count`).
        *   Trả về response JSON bao gồm: `products` (là `rows`), `totalProducts` (là `count`), `currentPage` (là `page`), `totalPages` (tính từ `count` và `limit`).
    *   **Cập nhật `tiktok-product-manager/server/routes/products.js`:** Không cần thay đổi.

## 2. Frontend (Client)

*   **Mục tiêu:** Gửi tham số trang hiện tại khi gọi API, hiển thị các nút điều khiển phân trang, và cập nhật danh sách sản phẩm khi người dùng chuyển trang.
*   **Các bước:**
    *   **Cập nhật `tiktok-product-manager/client/js/modules/api.js` (hàm `fetchProducts`):**
        *   Chấp nhận thêm tham số `page` và `limit`.
        *   Thêm `page` và `limit` vào `URLSearchParams` để gửi lên server.
    *   **Cập nhật `tiktok-product-manager/client/js/modules/dataLoaders.js` (hàm `loadProductsList`):**
        *   Chấp nhận tham số `page` (mặc định là 1).
        *   Gọi `fetchProducts` với cả `filters`, `page`, và `limit=30`.
        *   Nhận `products`, `totalProducts`, `currentPage`, `totalPages` từ response API.
        *   Gọi `renderProducts` với danh sách sản phẩm.
        *   Gọi hàm mới `renderPaginationControls` để hiển thị các nút phân trang.
    *   **Cập nhật `tiktok-product-manager/client/js/modules/uiRender.js`:**
        *   Tạo hàm mới `renderPaginationControls(totalProducts, currentPage, totalPages, limit)`:
            *   Tính toán và hiển thị các nút số trang, nút "Trước", "Sau".
            *   Vô hiệu hóa nút "Trước"/"Sau" khi cần thiết.
            *   Thêm thuộc tính `data-page` vào các nút.
        *   Đảm bảo có container HTML cho các nút phân trang (ví dụ: `#pagination-controls`).
    *   **Cập nhật `tiktok-product-manager/client/index.html`:**
        *   Thêm container `<div id="pagination-controls" class="mt-4 flex justify-center items-center space-x-2"></div>`.
    *   **Cập nhật `tiktok-product-manager/client/js/main.js` (hoặc module xử lý sự kiện):**
        *   Thêm trình xử lý sự kiện click cho `#pagination-controls`.
        *   Khi nút phân trang được nhấn, lấy `newPage` từ `data-page`, lấy `currentFilters`, và gọi `loadProductsList(currentFilters, newPage)`.
    *   **Cập nhật `tiktok-product-manager/client/js/modules/filterHandlers.js`:**
        *   Trong `applyFilters` và `resetFilters`, gọi `loadProductsList` với `page = 1`.

## 3. Sơ đồ luồng dữ liệu (Mermaid)

```mermaid
sequenceDiagram
    participant User
    participant ClientUI as Client UI (HTML/JS)
    participant FilterHandlers as filterHandlers.js
    participant DataLoaders as dataLoaders.js
    participant APIClient as api.js
    participant ServerAPI as Server API (routes/products.js)
    participant Controller as productController.js
    participant Database

    User->>ClientUI: Nhập bộ lọc / Nhấn nút lọc
    ClientUI->>FilterHandlers: applyFilters()
    FilterHandlers->>DataLoaders: loadProductsList(filters, page=1)
    DataLoaders->>APIClient: fetchProducts(filters, page=1, limit=30)
    APIClient->>ServerAPI: GET /api/products?filterParams&page=1&limit=30
    ServerAPI->>Controller: getAllProducts(req)
    Controller->>Database: findAndCountAll({ where: filterConditions, limit: 30, offset: 0 })
    Database-->>Controller: { count: totalMatching, rows: productsPage1 }
    Controller-->>ServerAPI: { products: productsPage1, totalProducts: totalMatching, currentPage: 1, totalPages: calculatedPages }
    ServerAPI-->>APIClient: Response JSON
    APIClient-->>DataLoaders: Response Data
    DataLoaders->>ClientUI: renderProducts(productsPage1)
    DataLoaders->>ClientUI: renderPaginationControls(totalMatching, 1, calculatedPages, 30)

    User->>ClientUI: Nhấn nút trang 2
    ClientUI->>DataLoaders: loadProductsList(currentFilters, page=2)
    DataLoaders->>APIClient: fetchProducts(currentFilters, page=2, limit=30)
    APIClient->>ServerAPI: GET /api/products?filterParams&page=2&limit=30
    ServerAPI->>Controller: getAllProducts(req)
    Controller->>Database: findAndCountAll({ where: filterConditions, limit: 30, offset: 30 })
    Database-->>Controller: { count: totalMatching, rows: productsPage2 }
    Controller-->>ServerAPI: { products: productsPage2, totalProducts: totalMatching, currentPage: 2, totalPages: calculatedPages }
    ServerAPI-->>APIClient: Response JSON
    APIClient-->>DataLoaders: Response Data
    DataLoaders->>ClientUI: renderProducts(productsPage2)
    DataLoaders->>ClientUI: renderPaginationControls(totalMatching, 2, calculatedPages, 30)