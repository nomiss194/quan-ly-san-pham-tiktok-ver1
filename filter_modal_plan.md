# Kế hoạch Chuyển Bộ lọc Sản phẩm vào Modal

## 1. Mục tiêu

Di chuyển các tùy chọn lọc sản phẩm từ hiển thị trực tiếp trên trang Products vào một modal popup để giao diện gọn gàng hơn, đặc biệt trên màn hình nhỏ.

## 2. Sơ đồ quy trình

```mermaid
graph TD
    A[Bắt đầu Yêu cầu Filter Modal] --> B{Phân tích};
    B --> C[HTML: Xóa Filter Section cũ];
    B --> D[HTML: Thêm Nút Filter (Vị trí mới)];
    B --> E[HTML: Tạo Filter Modal];
    B --> F[HTML: Di chuyển nội dung Filter vào Modal];
    B --> G[JS: Thêm Listener Mở/Đóng Modal Filter];
    B --> H[JS: Cập nhật applyFilters/resetFilters để đóng Modal];

    C & D & E & F --> I{UI Filter Modal Hoàn thành};
    G & H --> J{Logic Modal Filter Hoàn thành};

    I & J --> K[Kiểm thử];
    K --> L[Kết thúc];
```

## 3. Các bước thực hiện chi tiết

1.  **HTML (`tiktok-product-manager/client/index.html`):**
    *   **Xóa Filter Section cũ:** Tìm và xóa `div#product-filters` hiện tại trong `div#products-content`.
    *   **Cập nhật Header Trang Products:**
        *   Tìm `div` chứa header của trang Products (thường là `div` ngay sau `div#products-content`).
        *   Sửa cấu trúc để có một `div` chứa tiêu đề "Products" và nút "Filter" bên trái, và một `div` khác chứa nút "Manage Tags", "Add Product" bên phải. Ví dụ:
          ```html
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2"> <!-- Left side -->
               <h2 class="text-2xl font-semibold">Products</h2>
               <button id="open-filter-modal-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-white text-gray-700 hover:bg-gray-50 h-10 py-2 px-4 ml-4"><i data-lucide="filter" class="mr-2 h-4 w-4"></i>Filter</button>
            </div>
            <div class="flex gap-2"> <!-- Right side -->
               <button id="manage-tags-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-white text-gray-700 hover:bg-gray-50 h-10 py-2 px-4"><i data-lucide="tags" class="mr-2 h-4 w-4"></i>Manage Tags</button>
               <button id="add-product-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4"><i data-lucide="plus" class="mr-2 h-4 w-4"></i>Add Product</button>
            </div>
          </div>
          ```
    *   **Tạo Filter Modal:**
        *   Thêm một `div` mới ở cuối file (hoặc vị trí phù hợp cho các modal) với `id="filter-modal"` và class `hidden`.
        *   Sao chép nội dung HTML của `div#product-filters` cũ vào bên trong modal này.
        *   Thêm nút đóng (X) vào góc trên bên phải của modal với `id="close-filter-modal-btn"`.

2.  **JavaScript (`tiktok-product-manager/client/js/main.js` và các module):**
    *   **`main.js` (trong `DOMContentLoaded`):**
        *   Thêm listener `click` cho `#open-filter-modal-btn` để gọi `openModal('filter-modal')` (import `openModal` từ `modal.js`).
        *   Thêm listener `click` cho `#close-filter-modal-btn` để gọi `closeModal('filter-modal')` (import `closeModal` từ `modal.js`).
        *   Đảm bảo listener cho `#apply-filters-btn` và `#reset-filters-btn` vẫn được gắn đúng cách (chúng gọi `applyFilters` và `resetFilters` từ `filterHandlers.js`).
    *   **`modules/filterHandlers.js`:**
        *   Sửa hàm `applyFilters`: Sau khi gọi `loadProductsList(filters);`, thêm dòng `import { closeModal } from './modal.js'; closeModal('filter-modal');` (hoặc import `closeModal` ở đầu file).
        *   Sửa hàm `resetFilters`: Sau khi gọi `loadProductsList();`, thêm dòng `import { closeModal } from './modal.js'; closeModal('filter-modal');` (hoặc import `closeModal` ở đầu file).

3.  **Kiểm thử:**
    *   Kiểm tra nút "Filter" có mở đúng modal không.
    *   Kiểm tra nút đóng modal có hoạt động không.
    *   Kiểm tra các input filter bên trong modal có hoạt động không.
    *   Kiểm tra nút "Apply Filters" có áp dụng filter, tải lại danh sách và đóng modal không.
    *   Kiểm tra nút "Reset Filters" có xóa các giá trị filter, tải lại danh sách và đóng modal không.