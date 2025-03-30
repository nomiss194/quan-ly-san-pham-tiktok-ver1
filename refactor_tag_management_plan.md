# Kế hoạch Refactor Chức năng Quản lý Tag (Frontend)

**Mục tiêu:** Xóa bỏ code quản lý tag hiện tại đang bị lỗi và khó bảo trì, thay thế bằng một giải pháp mới, cải thiện trải nghiệm người dùng (UX) với chức năng tìm kiếm/sắp xếp trong modal và sử dụng component tag input hiện đại hơn để gán tag cho sản phẩm, đồng thời đảm bảo tính nhất quán trong hiển thị và lọc.

**Các Giai đoạn Chính:**

1.  **Chuẩn bị và Xóa Code Cũ:**
    *   **Xác định phạm vi:** Rà soát và đánh dấu tất cả các đoạn code liên quan đến chức năng tag hiện tại trong các file:
        *   `tiktok-product-manager/client/js/modules/tagManager.js` (Toàn bộ file)
        *   `tiktok-product-manager/client/js/main.js` (Các import, event listeners liên quan đến tag: `#manage-tags-btn`, `#tag-manager-modal`, `#tag-manager-form`, `#tag-manager-list`, `#product-tags`, `#edit-product-tags`)
        *   `tiktok-product-manager/client/index.html` (HTML của `#tag-manager-modal`, input `#product-tags`, `#edit-product-tags`)
        *   `tiktok-product-manager/client/js/modules/productHandlers.js` hoặc `uiRender.js` (Phần hiển thị tag trong bảng sản phẩm)
        *   `tiktok-product-manager/client/js/modules/filterHandlers.js` (Logic lọc theo tag, input `#filter-tags`)
        *   `tiktok-product-manager/client/js/modules/api.js` (Kiểm tra lại hàm `addProduct`, `updateProduct` xem cách gửi tag lên backend có cần thay đổi không)
    *   **Xóa code:** Xóa (hoặc comment out cẩn thận) các đoạn code đã xác định ở trên. Ưu tiên comment out trước để dễ dàng rollback nếu cần.

2.  **Xây dựng Lại Modal Quản lý Tag (`tagManager.js` và `index.html`):**
    *   **Thiết kế lại HTML:** Cập nhật cấu trúc HTML cho `#tag-manager-modal` trong `index.html` để bao gồm:
        *   Ô tìm kiếm tag.
        *   (Tùy chọn) Các nút/dropdown để sắp xếp danh sách tag (ví dụ: theo tên A-Z, Z-A).
        *   Danh sách tag được cập nhật để hiển thị kết quả tìm kiếm/sắp xếp.
        *   Form thêm/sửa tag (có thể giữ nguyên cấu trúc form cơ bản).
    *   **Viết lại `tagManager.js`:**
        *   Implement logic gọi API (`fetchAllTags`) để lấy danh sách tag khi mở modal.
        *   Implement chức năng tìm kiếm tag (client-side filtering dựa trên input tìm kiếm).
        *   Implement chức năng sắp xếp tag (client-side sorting).
        *   Viết lại logic hiển thị danh sách tag (`renderTagList`) để phản ánh kết quả tìm kiếm/sắp xếp.
        *   Viết lại logic xử lý form thêm/sửa tag (`handleCreateOrUpdateTag`), đảm bảo gọi đúng API (`createTag`, `updateTag`) và cập nhật lại danh sách sau khi thành công.
        *   Viết lại logic xóa tag (`handleDeleteTagClick`), gọi API (`deleteTagApi`) và cập nhật danh sách.
        *   Đảm bảo các nút Edit/Delete hoạt động đúng với danh sách đã lọc/sắp xếp.
        *   Quản lý trạng thái (state) của modal (danh sách tag gốc, danh sách hiển thị, giá trị tìm kiếm, tiêu chí sắp xếp).

3.  **Tích hợp Component Tag Input (Autocomplete/Tagify):**
    *   **Lựa chọn thư viện:** Quyết định sử dụng một thư viện JavaScript bên thứ ba cho tag input (ví dụ: [Tagify](https://github.com/yairEO/tagify), Select2, Choices.js) hoặc tự xây dựng. *Khuyến nghị sử dụng thư viện để tiết kiệm thời gian và tận dụng các tính năng sẵn có.*
    *   **Cài đặt thư viện:** Nếu sử dụng thư viện, thêm nó vào project (ví dụ: qua npm/yarn hoặc CDN).
    *   **Thay thế Input cũ:** Trong `index.html`, thay thế các input text `#product-tags` và `#edit-product-tags` bằng cấu trúc HTML cần thiết cho component tag input mới trong modal thêm và sửa sản phẩm.
    *   **Khởi tạo Component:** Trong `main.js` hoặc `productHandlers.js` (nơi xử lý modal sản phẩm), viết code để khởi tạo component tag input khi modal được mở.
        *   Cấu hình component để lấy danh sách gợi ý tag từ `fetchAllTags`.
        *   Xử lý việc hiển thị các tag đã có của sản phẩm khi mở modal sửa.
    *   **Cập nhật Logic Lưu Sản phẩm:** Sửa đổi hàm xử lý submit form thêm/sửa sản phẩm trong `main.js` (hoặc `productHandlers.js`):
        *   Lấy danh sách các tag đã chọn từ component tag input mới.
        *   Định dạng lại dữ liệu tag (ví dụ: thành mảng các tên tag hoặc ID tag) phù hợp với yêu cầu của API `addProduct`/`updateProduct`.
        *   Gửi dữ liệu đã cập nhật lên backend.

4.  **Đồng bộ Hóa Hiển thị và Lọc:**
    *   **Hiển thị Tag trong Bảng Sản phẩm:** Cập nhật hàm render bảng sản phẩm (trong `uiRender.js` hoặc `productHandlers.js`) để hiển thị các tag một cách nhất quán với định dạng mới (nếu có thay đổi). Đảm bảo hiển thị đúng màu sắc tag.
    *   **Lọc Sản phẩm theo Tag:** Cập nhật logic trong `filterHandlers.js`:
        *   Xem xét thay đổi input `#filter-tags` trong modal filter thành component tương tự (hoặc giữ nguyên input text nhưng xử lý logic lọc cho phù hợp).
        *   Đảm bảo hàm `applyFilters` gửi đúng tham số lọc tag lên backend hoặc thực hiện lọc client-side một cách chính xác.

5.  **Kiểm thử và Hoàn thiện:**
    *   **Kiểm thử toàn diện:** Test kỹ lưỡng tất cả các chức năng liên quan đến tag:
        *   Mở modal quản lý tag, tìm kiếm, sắp xếp.
        *   Thêm, sửa, xóa tag trong modal.
        *   Mở modal thêm sản phẩm, nhập/chọn tag bằng component mới, lưu sản phẩm.
        *   Mở modal sửa sản phẩm, xem tag cũ, sửa tag, lưu sản phẩm.
        *   Kiểm tra hiển thị tag trong danh sách sản phẩm.
        *   Mở modal lọc, lọc theo tag, kiểm tra kết quả.
    *   **Sửa lỗi:** Khắc phục các lỗi phát sinh trong quá trình kiểm thử.
    *   **Tinh chỉnh:** Cải thiện UI/UX nếu cần thiết dựa trên kết quả kiểm thử.

**Sơ đồ Luồng Dữ liệu (Ví dụ cho việc Thêm Sản phẩm):**

```mermaid
sequenceDiagram
    participant User
    participant ProductModal as Add Product Modal (index.html)
    participant TagInput as Tag Input Component
    participant MainJS as main.js / productHandlers.js
    participant API as api.js
    participant Backend

    User->>ProductModal: Mở modal thêm sản phẩm
    MainJS->>TagInput: Khởi tạo component
    MainJS->>API: fetchAllTags()
    API-->>Backend: GET /api/tags
    Backend-->>API: Danh sách tags
    API-->>MainJS: Trả về danh sách tags
    MainJS->>TagInput: Cung cấp danh sách tags (cho gợi ý)

    User->>ProductModal: Nhập thông tin sản phẩm
    User->>TagInput: Gõ và chọn tags
    TagInput-->>MainJS: Cập nhật danh sách tags đã chọn

    User->>ProductModal: Click nút "Add Product"
    MainJS->>TagInput: Lấy danh sách tags đã chọn
    MainJS->>MainJS: Lấy thông tin sản phẩm khác (URL, notes,...)
    MainJS->>MainJS: Định dạng dữ liệu (bao gồm tags)
    MainJS->>API: addProduct(productData)
    API-->>Backend: POST /api/products (với productData)
    Backend-->>API: Kết quả (thành công/lỗi)
    API-->>MainJS: Trả về kết quả
    alt Thành công
        MainJS->>ProductModal: Đóng modal
        MainJS->>MainJS: Tải lại danh sách sản phẩm (nếu cần)
        MainJS->>User: Thông báo thành công
    else Lỗi
        MainJS->>User: Thông báo lỗi
    end