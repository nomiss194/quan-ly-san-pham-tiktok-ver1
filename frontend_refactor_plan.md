# Kế hoạch Refactor Frontend (Chia nhỏ app.js)

## 1. Mục tiêu

Chia nhỏ file `client/js/app.js` thành các module JavaScript riêng biệt sử dụng ES Modules để cải thiện khả năng đọc, bảo trì và giảm lỗi.

## 2. Cấu trúc thư mục đề xuất

```
tiktok-product-manager/
└── client/
    ├── index.html
    └── js/
        ├── main.js       # Entry point mới
        └── modules/      # Thư mục chứa các module con
            ├── api.js
            ├── uiRender.js
            ├── auth.js
            ├── modal.js
            ├── productHandlers.js
            ├── goalHandlers.js
            ├── tagManager.js
            ├── imageHandlers.js
            ├── routing.js
            └── filterHandlers.js
```

## 3. Các bước thực hiện

1.  **Tạo Thư mục và Files:**
    *   Tạo thư mục `tiktok-product-manager/client/js/modules/`.
    *   Tạo các file `.js` bên trong `modules/` theo danh sách ở mục 2.
    *   Tạo file `tiktok-product-manager/client/js/main.js`.

2.  **Di chuyển Code và Export/Import:**
    *   **`modules/api.js`:** Di chuyển tất cả các hàm gọi API (ví dụ: `login`, `register`, `fetchApi`, `fetchProducts`, `updateProduct`, `createTag`, `fetchGoals`, `addVideoLog`, `fetchTrash`, `fetchAllTags`...) từ `app.js` vào đây. Thêm `export` trước mỗi hàm.
    *   **`modules/uiRender.js`:** Di chuyển các hàm render UI (ví dụ: `renderProducts`, `renderGoals`, `renderTrash`, `renderDashboardStats`, `renderTagList`). Thêm `export` trước mỗi hàm. Di chuyển cả hàm helper `getContrastYIQ` vào đây và export nó.
    *   **`modules/auth.js`:** Di chuyển các hàm `login`, `register`, `logout`, `showAuth`. Export chúng. Import `fetchApi` từ `api.js` nếu cần.
    *   **`modules/modal.js`:** Di chuyển `openModal`, `closeModal`, `openEditModal`, `populateGoalForm`, `openEditGoalModal`. Export chúng. Import các hàm API cần thiết (ví dụ: `fetchApi`, `fetchGoals`).
    *   **`modules/productHandlers.js`:** Di chuyển các hàm xử lý sự kiện liên quan đến sản phẩm: `handleAddVideoLog`, `handleVideoLogDateChange`, `handleDeleteProduct` (soft delete), logic xử lý `toggle-purchase`, `remove-tag`, `add-tag-input`, `save-new-tag`, `cancel-add-tag`, `edit-notes`, `save-notes`, `cancel-edit-notes`. Export chúng. Import các hàm API (`updateProduct`, `fetchApi`, `deleteProduct`) và UI (`loadProductsList`, `renderDashboardStats`) cần thiết.
    *   **`modules/goalHandlers.js`:** Di chuyển `handleDeleteGoal`, logic xử lý submit form Add/Edit Goal. Export chúng. Import API (`createOrUpdateGoal`, `deleteGoal`) và UI (`loadGoalsList`, `closeModal`) cần thiết.
    *   **`modules/tagManager.js`:** Di chuyển `currentTags`, `renderTagList`, `resetTagForm`, `openTagManager`, `handleCreateOrUpdateTag`, `handleEditTagClick`, `handleDeleteTagClick`. Export các hàm cần thiết (ví dụ: `openTagManager`). Import API (`fetchAllTags`, `createTag`, `updateTag`, `deleteTagApi`) và UI (`renderTagList`, `resetTagForm`, `openModal`) cần thiết.
    *   **`modules/imageHandlers.js`:** Di chuyển `handleImagePaste`, `handleImageUpload`. Export chúng.
    *   **`modules/routing.js`:** Di chuyển `showDashboard`, `handleRoute`, `setupTabNavigation`. Export chúng. Import các hàm load data (`loadProductsList`, `loadGoalsList`, `loadTrashList`, `renderDashboardStats`) và `showAuth`.
    *   **`modules/filterHandlers.js`:** Di chuyển `applyFilters`, `resetFilters`. Export chúng. Import `loadProductsList`.
    *   **`main.js`:**
        *   Di chuyển toàn bộ nội dung bên trong `document.addEventListener('DOMContentLoaded', () => { ... });` từ `app.js` cũ vào đây.
        *   Thêm các lệnh `import` cần thiết ở đầu file cho tất cả các hàm được gọi bên trong `DOMContentLoaded` (ví dụ: `import { showAuth, showDashboard } from './modules/routing.js';`, `import { login, register } from './modules/auth.js';`, `import { openModal, closeModal } from './modules/modal.js';`, etc.).
        *   Đảm bảo các listener gọi đúng các hàm đã được import.

3.  **Cập nhật `index.html`:**
    *   Thay đổi thẻ script cuối cùng thành `<script type="module" src="/js/main.js"></script>`.

4.  **Xóa `app.js` cũ:** Sau khi hoàn tất và kiểm thử, xóa file `tiktok-product-manager/client/js/app.js`.

5.  **Kiểm thử:** Kiểm tra kỹ lưỡng tất cả các chức năng sau khi refactor để đảm bảo mọi thứ hoạt động đúng như trước. Kiểm tra Console trình duyệt để tìm lỗi import/export hoặc lỗi runtime.