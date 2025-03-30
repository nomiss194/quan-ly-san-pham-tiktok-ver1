# Kế hoạch triển khai chỉnh sửa trực tiếp (Inline Editing) cho Tags và Notes

**Mục tiêu:** Cho phép người dùng chỉnh sửa Tags (với gợi ý) và Notes (luôn hiển thị textarea) trực tiếp trên dòng sản phẩm trong bảng, với thay đổi được lưu tự động khi người dùng bấm ra ngoài hoặc nhấn Enter.

**Kế hoạch chi tiết:**

1.  **Cập nhật Frontend (`tiktok-product-manager/client/js/modules/uiRender.js` - hàm `renderProducts`):**
    *   **Cột Tags (`product-tags-cell`):**
        *   Thay thế nội dung hiện tại của `<td>` bằng một thẻ `<input>` duy nhất (ví dụ: `class="inline-tagify-input" data-product-id="${product.id}"`).
        *   Trong JavaScript (ví dụ: `productHandlers.js` hoặc `main.js` sau khi render), tìm các input này và khởi tạo Tagify cho từng cái:
            *   Lấy danh sách tất cả các tag hiện có (`whitelist`) từ API (tận dụng hàm lấy tags).
            *   Thiết lập giá trị ban đầu của Tagify bằng các tag hiện tại của sản phẩm (`product.Tags`).
            *   Sử dụng `whitelist` cho gợi ý (dropdown).
            *   Gắn trình xử lý sự kiện `add`/`remove` của Tagify để gọi hàm xử lý cập nhật API.
    *   **Cột Notes (`product-notes-cell`):**
        *   Thay thế nội dung hiện tại của `<td>` bằng một thẻ `<textarea>` (ví dụ: `class="inline-notes-textarea" data-product-id="${product.id}"`).
        *   Đặt giá trị ban đầu của `<textarea>` là `product.notes`.
        *   Gắn trình xử lý sự kiện `blur`/`keydown` (cho Enter) để gọi hàm xử lý cập nhật API nếu nội dung thay đổi. Cần lưu giá trị gốc (ví dụ trong `dataset`) để so sánh.

2.  **Cập nhật Frontend (`tiktok-product-manager/client/js/modules/productHandlers.js` hoặc module tương tự):**
    *   **Xử lý sự kiện Tagify:**
        *   Tạo hàm `handleInlineTagAdd(event)`: Lấy `productId` từ `event.detail.tagify.DOM.input.dataset.productId`, lấy thông tin tag mới từ `event.detail.data`, gọi API `addProductTag(productId, tagData)`.
        *   Tạo hàm `handleInlineTagRemove(event)`: Lấy `productId` từ `event.detail.tagify.DOM.input.dataset.productId`, lấy `tagId` từ `event.detail.data`, gọi API `removeProductTag(productId, tagId)`.
    *   **Xử lý sự kiện Notes Textarea:**
        *   Tạo hàm `handleInlineNotesUpdate(event)`: Lấy `productId` từ `event.target.dataset.productId`, lấy giá trị mới từ `event.target.value`. So sánh với giá trị cũ (lưu trong `dataset` hoặc biến). Nếu khác, gọi API `updateProductNotes(productId, newValue)`. Cập nhật giá trị gốc sau khi lưu thành công.
    *   **Gắn kết sự kiện:** Sử dụng event delegation trên bảng (`#products-list`) trong `main.js` hoặc `app.js` để lắng nghe các sự kiện `add`, `remove` (từ Tagify), `blur`, `keydown` (từ textarea) và gọi các hàm xử lý tương ứng.

3.  **Cập nhật Frontend (`tiktok-product-manager/client/js/modules/api.js`):**
    *   Đảm bảo/Tạo các hàm gọi API:
        *   `addProductTag(productId, tagData)` (gọi `POST /api/products/${productId}/tags`)
        *   `removeProductTag(productId, tagId)` (gọi `DELETE /api/products/${productId}/tags/${tagId}`)
        *   `updateProductNotes(productId, notes)` (gọi `PUT /api/products/${productId}` với body `{ notes }`) - Có thể dùng lại hàm `updateProduct`.
        *   `fetchAllTags()` (gọi `GET /api/tags`) để lấy `whitelist` cho Tagify.

4.  **Kiểm tra/Cập nhật Backend (Server):**
    *   **Routes (`tiktok-product-manager/server/routes/products.js`, `tiktok-product-manager/server/routes/tags.js`):**
        *   Xác nhận có route `POST /api/products/:productId/tags`.
        *   Xác nhận có route `DELETE /api/products/:productId/tags/:tagId`.
        *   Xác nhận có route `PUT /api/products/:productId`.
        *   Xác nhận có route `GET /api/tags`.
    *   **Controllers (`tiktok-product-manager/server/controllers/productController.js`, `tiktok-product-manager/server/controllers/tagController.js`):**
        *   Kiểm tra logic controller cho các route trên, đảm bảo xử lý đúng việc liên kết/hủy liên kết tag và cập nhật trường `notes`.

5.  **CSS Styling:**
    *   Điều chỉnh CSS để `<input>` Tagify và `<textarea>` hiển thị phù hợp trong ô của bảng (kích thước, padding, border khi focus, v.v.).
    *   Xem xét thêm hiệu ứng nhỏ khi lưu thành công/thất bại.

**Sơ đồ luồng dữ liệu (Mermaid):**

```mermaid
sequenceDiagram
    participant User
    participant TableRow as Product Row (UI)
    participant TagifyInput as Inline Tagify Input
    participant NotesTextarea as Inline Notes Textarea
    participant Handlers as productHandlers.js
    participant API as api.js
    participant Server

    User->>TagifyInput: Thêm/Xóa tag
    TagifyInput->>Handlers: Trigger 'add'/'remove' event
    Handlers->>API: Gọi addProductTag / removeProductTag
    API->>Server: Gửi request POST/DELETE /api/products/:id/tags...
    Server-->>API: Phản hồi (Success/Error)
    API-->>Handlers: Trả kết quả

    User->>NotesTextarea: Nhập ghi chú
    User->>NotesTextarea: Bấm ra ngoài (blur) / Nhấn Enter
    NotesTextarea->>Handlers: Trigger 'blur'/'keydown' event
    Handlers->>API: Gọi updateProductNotes (nếu có thay đổi)
    API->>Server: Gửi request PUT /api/products/:id (với notes)
    Server-->>API: Phản hồi (Success/Error)
    API-->>Handlers: Trả kết quả