# Kế hoạch điều chỉnh Layout Card Sản phẩm

**Mục tiêu:** Cập nhật giao diện trang sản phẩm để:
1.  Hiển thị ảnh sản phẩm dưới dạng hình vuông (tỷ lệ 1:1).
2.  Hiển thị 4 card sản phẩm trên một hàng đối với màn hình PC rộng (`lg` trở lên).
3.  Hiển thị 2 card sản phẩm trên một hàng đối với màn hình nhỏ hơn (`sm` đến `lg`).
4.  Hiển thị 1 card sản phẩm trên một hàng đối với màn hình rất nhỏ.

**Các bước thực hiện:**

1.  **Điều chỉnh CSS cho ảnh sản phẩm:**
    *   **Tệp:** `tiktok-product-manager/client/js/modules/uiRender.js`
    *   **Dòng:** `135` (bên trong hàm `renderProducts`)
    *   **Thay đổi:** Cập nhật lớp CSS của thẻ `<img>` từ:
        ```html
        class="product-image w-full h-48 object-cover rounded-md cursor-pointer"
        ```
        thành:
        ```html
        class="product-image w-full aspect-square object-cover rounded-md cursor-pointer"
        ```
    *   **Giải thích:** Bỏ chiều cao cố định (`h-48`), thêm tỷ lệ khung hình vuông (`aspect-square`) và giữ `object-cover` để ảnh lấp đầy khung vuông.

2.  **Điều chỉnh Grid Layout cho Card Container:**
    *   **Tệp:** `tiktok-product-manager/client/index.html`
    *   **Dòng:** `184`
    *   **Thay đổi:** Cập nhật lớp CSS của `div#product-cards-container` từ:
        ```html
        class="grid grid-cols-1 sm:grid-cols-2 gap-4"
        ```
        thành:
        ```html
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        ```
    *   **Giải thích:** Thêm `lg:grid-cols-4` để hiển thị 4 cột trên màn hình lớn (1024px trở lên), giữ nguyên 2 cột cho màn hình nhỏ (`sm`) và 1 cột cho màn hình rất nhỏ.

**Sơ đồ minh họa:**

```mermaid
graph TD
    A[Yêu cầu: Ảnh vuông, Card nhỏ, Layout đáp ứng] --> B{Phân tích Code};
    B --> C[Phát hiện: Ảnh dùng h-48, object-cover trong uiRender.js];
    B --> D[Phát hiện: Grid dùng sm:grid-cols-2 trong index.html];
    C --> E[Giải pháp 1: Dùng aspect-square, bỏ h-48];
    D --> F[Giải pháp 2: Thêm lg:grid-cols-4];
    E & F --> G[Kế hoạch: Chỉnh sửa uiRender.js và index.html];