# Kế hoạch Cải tiến Trang Sản phẩm

## 1. Mục tiêu

Bổ sung các chức năng filter nâng cao, chỉnh sửa inline cho status, tag, notes vào trang quản lý sản phẩm (`/products`).

## 2. Sơ đồ quy trình

```mermaid
graph TD
    A[Bắt đầu Yêu cầu Mới] --> B{Phân tích Yêu cầu};
    B --> C[Backend: Cập nhật Filter API (Date, Video Count)];
    B --> D[Frontend: UI Filter (Date, Video Count)];
    B --> E[Frontend: Logic Filter];
    B --> F[Frontend: UI Inline Status (Clickable Badge/Toggle)];
    B --> G[Frontend: Logic Inline Status (API Call)];
    B --> H[Frontend: UI Inline Tags (Display Badges, Add/Remove Buttons)];
    B --> I[Frontend: Logic Inline Tags (API Call)];
    B --> J[Frontend: UI Inline Notes (Truncated Display, Edit Area)];
    B --> K[Frontend: Logic Inline Notes (API Call)];

    C --> L{Backend Hoàn thành};
    D & E --> M{Filter Hoàn thành};
    F & G --> N{Inline Status Hoàn thành};
    H & I --> O{Inline Tags Hoàn thành};
    J & K --> P{Inline Notes Hoàn thành};

    L & M & N & O & P --> Q[Kiểm thử & Hoàn thiện];
    Q --> R[Kết thúc];

    subgraph Backend
        C;
    end

    subgraph Frontend
        D; E; F; G; H; I; J; K;
    end
```

## 3. Các bước thực hiện chi tiết

1.  **Backend - Cập nhật Filter API (`tiktok-product-manager/server/controllers/productController.js` -> `getAllProducts`):**
    *   Thêm logic để nhận và xử lý các query parameters mới:
        *   `startDate`, `endDate`: Lọc theo `created_at` sử dụng `Op.between`.
        *   `maxVideoCount`: Lọc theo `video_count` sử dụng `Op.lte` (less than or equal to).

2.  **Frontend - Filter UI & Logic (`tiktok-product-manager/client/index.html`, `tiktok-product-manager/client/js/app.js`):**
    *   **HTML:** Thêm các input cần thiết vào khu vực filter trên trang Products (ví dụ: 2 input `type="date"` cho khoảng ngày tạo, 1 input `type="number"` cho số video tối đa).
    *   **JavaScript:**
        *   Cập nhật hàm xử lý sự kiện filter (ví dụ: khi nhấn nút "Apply Filters") để đọc giá trị từ các input mới này.
        *   Sửa đổi hàm `fetchProducts` để chấp nhận các tham số filter mới.
        *   Sửa đổi hàm `loadProductsList` (hoặc nơi gọi `fetchProducts`) để xây dựng đối tượng query parameters dựa trên các giá trị filter đã chọn và truyền vào `fetchProducts`.

3.  **Frontend - Inline Status Edit (`tiktok-product-manager/client/js/app.js`):**
    *   **`renderProducts`:**
        *   Tìm span hiển thị status (`purchased`).
        *   Thêm thuộc tính `data-action="toggle-purchase"` và `data-current-status="${product.purchased}"` vào span đó.
        *   Thêm class CSS để làm cho nó trông giống như có thể click được (ví dụ: `cursor-pointer`).
    *   **Event Listener (`#products-list`):**
        *   Thêm một `else if (action === 'toggle-purchase')`.
        *   Bên trong, lấy `productId` và `currentStatus` (chuyển đổi từ chuỗi sang boolean).
        *   Gọi `updateProduct(productId, { purchased: !currentStatus })`.
        *   Sau khi thành công, cập nhật trực tiếp text và class của span status trong DOM hoặc gọi lại `loadProductsList` để làm mới toàn bộ danh sách.

4.  **Frontend - Inline Tag Management (`tiktok-product-manager/client/js/app.js`):**
    *   **`renderProducts`:**
        *   Thêm một `div` (ví dụ: `product-tags-container`) trong mỗi dòng sản phẩm.
        *   Lặp qua `product.Tags`: Với mỗi tag, tạo một span badge chứa tên tag và một nút 'x' nhỏ bên cạnh (`<button data-action="remove-tag" data-tag-id="${tag.id}">x</button>`).
        *   Thêm một nút "Add Tag" (`<button data-action="add-tag-input"> + </button>`) vào cuối `div` chứa tags.
    *   **Event Listener (`#products-list`):**
        *   Thêm `else if (action === 'remove-tag')`:
            *   Lấy `productId` và `tagIdToRemove`.
            *   Lấy danh sách các tag hiện tại của sản phẩm (có thể cần fetch lại hoặc lấy từ dữ liệu đã render).
            *   Tạo danh sách tên tag mới (loại bỏ tag cần xóa).
            *   Gọi `updateProduct(productId, { tags: newTagNames })`.
            *   Cập nhật UI/tải lại danh sách.
        *   Thêm `else if (action === 'add-tag-input')`:
            *   Tạo và chèn một ô input text và nút "Save" (`<button data-action="save-new-tag">Save</button>`) vào `product-tags-container`. Đặt focus vào input.
        *   Thêm `else if (action === 'save-new-tag')`:
            *   Lấy `productId` và tên tag mới từ input.
            *   Lấy danh sách các tag hiện tại.
            *   Thêm tên tag mới vào danh sách.
            *   Gọi `updateProduct(productId, { tags: updatedTagNames })`.
            *   Xóa ô input và nút save, cập nhật UI/tải lại danh sách.

5.  **Frontend - Inline Notes Display & Edit (`tiktok-product-manager/client/js/app.js`):**
    *   **`renderProducts`:**
        *   Thêm một `div` (ví dụ: `product-notes-cell`) vào dòng sản phẩm.
        *   Bên trong `div` này, thêm:
            *   Một `div` (`product-notes-display`) để hiển thị ghi chú rút gọn (ví dụ: `product.notes?.substring(0, 50) + (product.notes?.length > 50 ? '...' : '')`). Kèm theo nút "Edit" (`<button data-action="edit-notes">Edit</button>`).
            *   Một `div` (`product-notes-edit`, ban đầu ẩn) chứa `textarea` và nút "Save" (`<button data-action="save-notes">Save</button>`).
    *   **Event Listener (`#products-list`):**
        *   Thêm `else if (action === 'edit-notes')`:
            *   Lấy `productId`.
            *   Tìm `div` cha (`product-notes-cell`).
            *   Ẩn `product-notes-display`, hiện `product-notes-edit`.
            *   Điền nội dung đầy đủ của `product.notes` vào `textarea`.
        *   Thêm `else if (action === 'save-notes')`:
            *   Lấy `productId` và nội dung mới từ `textarea`.
            *   Gọi `updateProduct(productId, { notes: newNotes })`.
            *   Cập nhật nội dung rút gọn trong `product-notes-display`.
            *   Ẩn `product-notes-edit`, hiện `product-notes-display`.

6.  **Kiểm thử & Hoàn thiện:**
    *   Kiểm tra kỹ lưỡng các chức năng filter, inline edit status, tag, notes.
    *   Đảm bảo giao diện người dùng phản hồi tốt và cập nhật đúng sau mỗi hành động.
    *   Xử lý các trường hợp biên (ví dụ: xóa tag cuối cùng, lưu ghi chú rỗng).