# Kế hoạch Cải thiện Hiển thị Sản phẩm trên iPad (Card View)

**Mục tiêu:** Tối ưu hóa giao diện hiển thị danh sách sản phẩm trên màn hình iPad bằng cách chuyển sang dạng "Thẻ" (Card View), tích hợp chỉnh sửa nhanh Notes và Tags.

**Các bước thực hiện:**

1.  **Thiết kế Cấu trúc Thẻ (Card):**
    *   Sử dụng thẻ `div` làm container chính cho mỗi sản phẩm thay vì `<tr>`.
    *   Bên trong thẻ `div`, sắp xếp các thành phần:
        *   Ảnh sản phẩm (`img`).
        *   Link TikTok (`a`) có thể click được.
        *   Trạng thái (`span` với màu nền tương ứng - Purchased/Pending).
        *   Khu vực hiển thị/chỉnh sửa Tags: Sử dụng input `Tagify` tương tự như trong bảng hiện tại, cho phép thêm/xóa tag trực tiếp.
        *   Khu vực hiển thị/chỉnh sửa Notes: Sử dụng `textarea` tương tự như trong bảng hiện tại, cho phép nhập và lưu ghi chú.
        *   Nút menu (icon 3 chấm dọc `...`) để chứa các hành động Edit/Delete (mở modal chỉnh sửa đầy đủ).

2.  **Triển khai Responsive Design:**
    *   Sử dụng **CSS Media Queries** (thông qua các lớp tiện ích của Tailwind CSS như `md:`, `lg:`) để xác định khi nào hiển thị dạng bảng (desktop) và khi nào hiển thị dạng thẻ (tablet/iPad).
    *   Container chứa danh sách sản phẩm:
        *   Màn hình nhỏ (mặc định): `display: grid` để xếp thẻ.
        *   Màn hình vừa trở lên (`md:`): `display: block` và chỉ hiển thị `table`.
    *   Thẻ `table`: Ẩn trên màn hình nhỏ (`hidden`), hiển thị dạng bảng trên màn hình vừa trở lên (`md:table`).
    *   Các thẻ `div` (card): Hiển thị trên màn hình nhỏ, ẩn trên màn hình vừa trở lên (`md:hidden`).

3.  **Cập nhật Hàm `renderProducts` trong `tiktok-product-manager/client/js/modules/uiRender.js`:**
    *   Hàm sẽ tạo cấu trúc HTML cho thẻ `div` **bao gồm cả input Tagify và textarea cho Notes**.
    *   Thêm các thuộc tính `data-*` cần thiết cho inline editing vào các input/textarea trong card view.
    *   Điều chỉnh container `#products-list` hoặc phần tử cha nếu cần để phù hợp với cả hai layout.

4.  **Cập nhật Logic Inline Editing (`initializeInlineEditing` trong `tiktok-product-manager/client/js/modules/productHandlers.js`):**
    *   Hàm `initializeInlineEditing` cần được điều chỉnh để tìm và khởi tạo Tagify, gắn event listener cho cả input/textarea trong **Card View** và **Table View**.
    *   Đảm bảo chức năng chỉnh sửa nhanh hoạt động nhất quán trên mọi kích thước màn hình.

5.  **Xử lý Hành động (Edit/Delete) trên Thẻ:**
    *   Thêm nút menu (icon `...`) vào mỗi thẻ.
    *   Gắn sự kiện click để hiển thị menu dropdown nhỏ chứa "Edit" và "Delete".
    *   Các lựa chọn này sẽ gọi đến các hàm xử lý sự kiện hiện có để mở modal hoặc xóa sản phẩm.

**Sơ đồ Minh họa (Mermaid):**

```mermaid
graph LR
    subgraph Desktop / Màn hình lớn
        A[Trang Products] --> B(renderProducts);
        B --> C{Hiển thị dạng Table};
        C --> D[Table Rows (tr/td)];
        D --> D1(Inline Edit: Tags Input);
        D --> D2(Inline Edit: Notes Textarea);
        D --> D3(Actions: Edit/Delete Buttons);
    end
    subgraph iPad / Màn hình nhỏ
        E[Trang Products] --> F(renderProducts);
        F --> G{Hiển thị dạng Card View};
        G --> H[Grid các Card (div)];
        H --> I{Card: Ảnh, Link, Status};
        H --> K(Inline Edit: Tags Input);
        H --> L(Inline Edit: Notes Textarea);
        H --> J[Nút '...' cho Actions Edit/Delete];
    end

    style C fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:2px