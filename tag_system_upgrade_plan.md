# Kế hoạch Nâng cấp Hệ thống Tag

## 1. Mục tiêu

Nâng cấp hệ thống quản lý tag để hỗ trợ CRUD tập trung, gán màu sắc cho tag, và chọn tag nhanh khi thêm/sửa sản phẩm.

## 2. Sơ đồ quy trình

```mermaid
graph TD
    A[Bắt đầu Yêu cầu Tag CRUD] --> B{Phân tích};
    B --> C[Backend: Migration Add Color];
    B --> D[Backend: Model Update Color];
    B --> E[Backend: API Update (PUT /:id, POST color)];
    B --> F[Frontend: Tag Manager Modal HTML];
    B --> G[Frontend: Tag Manager JS (Fetch, Render, CRUD handlers)];
    B --> H[Frontend: Trigger for Tag Manager];
    B --> I[Frontend: Product Modal UI Update (Tag Selector)];
    B --> J[Frontend: Product Modal JS (Fetch/Render Available Tags, Select/Deselect)];
    B --> K[Frontend: Update Tag Display (Use Color)];

    C & D & E --> L{Backend Tag CRUD+Color Done};
    F & G & H --> M{Tag Manager UI Done};
    I & J --> N{Product Tag Selection Done};
    K --> O{Tag Display Updated};

    L & M & N & O --> P[Kiểm thử];
    P --> Q[Kết thúc];

    subgraph Backend
        C; D; E;
    end

    subgraph Frontend
        F; G; H; I; J; K;
    end
```

## 3. Các bước thực hiện chi tiết

1.  **Backend - Cập nhật Database & Model:**
    *   **Migration:** Tạo migration `add-color-to-tags` để thêm cột `color` (VARCHAR(7), nullable) vào bảng `tags`.
    *   **Model:** Cập nhật model `Tag` (`server/models/tag.js`) để thêm trường `color`.

2.  **Backend - Cập nhật Tag API (`/api/tags`):**
    *   **`POST /` (Create):** Sửa `tagController.createTag` để nhận và lưu `color`.
    *   **`PUT /:id` (Update):** Thêm route `PUT /:id` và hàm `tagController.updateTag` để cập nhật `name` và/hoặc `color`.
    *   **`GET /` (Read All):** Đảm bảo `tagController.getAllTags` trả về cả `color`.
    *   **`DELETE /:id` (Delete):** Kiểm tra lại `tagController.deleteTag`.

3.  **Frontend - Giao diện Quản lý Tag (Tag Manager):**
    *   **Vị trí:** Tạo modal `#tag-manager-modal`.
    *   **HTML (`client/index.html`):** Thiết kế modal với danh sách tag (tên, màu, nút Edit/Delete) và form thêm/sửa tag (tên, màu).
    *   **JavaScript (`client/js/app.js`):**
        *   Thêm nút mở modal trên trang Products.
        *   Viết hàm `openTagManager()`: Gọi `GET /api/tags`, gọi `renderTagList`.
        *   Viết hàm `renderTagList(tags)`: Render danh sách tag, gắn listeners.
        *   Viết các handlers: `handleCreateTag`, `handleEditTag`, `handleUpdateTag`, `handleDeleteTag`.

4.  **Frontend - Cập nhật Modal Add/Edit Product:**
    *   **HTML (`client/index.html`):** Thay input text tag bằng khu vực hiển thị tag đã chọn (badge + nút xóa) và danh sách tag có sẵn (badge có thể click).
    *   **JavaScript (`client/js/app.js`):**
        *   Sửa `openModal`/`openEditModal`: Fetch `GET /api/tags`, render danh sách tag có sẵn.
        *   Thêm logic xử lý click chọn/bỏ chọn tag.
        *   Sửa logic submit form: Lấy danh sách tên tag đã chọn để gửi lên backend.

5.  **Frontend - Cập nhật Hiển thị Tag:**
    *   **JavaScript (`client/js/app.js`):** Sửa `renderProducts` và các nơi khác để sử dụng `tag.color` khi hiển thị badge tag (ví dụ: `style="background-color: ${tag.color};"` hoặc `style="border-color: ${tag.color};"`). Đảm bảo màu chữ tương phản.

6.  **Kiểm thử:** Kiểm tra toàn diện các chức năng CRUD tag, chọn tag cho sản phẩm, hiển thị màu sắc.