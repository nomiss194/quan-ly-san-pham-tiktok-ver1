# Kế hoạch: Định dạng Thời gian Tạo Sản phẩm Tương đối

**Mục tiêu:** Hiển thị thời gian tạo sản phẩm (`created_at`) một cách "thông minh" hơn trên thẻ sản phẩm và trong danh sách sản phẩm gần đây trên Bảng điều khiển, sử dụng các nhãn tương đối (Hôm nay, Hôm qua, X ngày trước) cho các ngày gần đây và giữ nguyên giờ.

**Kế hoạch chi tiết:**

1.  **Tạo Hàm Trợ Giúp (`tiktok-product-manager/client/js/modules/uiRender.js`):**
    *   Tạo hàm mới `formatRelativeCreatedAt(dateString)`.
    *   Hàm này nhận chuỗi ngày giờ `created_at`.
    *   Tính toán sự chênh lệch ngày giữa ngày tạo và ngày hiện tại.
    *   Lấy phần giờ:phút:giây từ ngày tạo.
    *   Trả về chuỗi định dạng:
        *   `"Hôm nay, HH:MM:SS"` nếu là ngày hiện tại.
        *   `"Hôm qua, HH:MM:SS"` nếu là ngày hôm qua.
        *   `"X ngày trước, HH:MM:SS"` nếu cách đây 2-7 ngày.
        *   `"DD/MM/YYYY, HH:MM:SS"` (định dạng Việt Nam) nếu cũ hơn 7 ngày.
        *   `'N/A'` nếu đầu vào không hợp lệ.

2.  **Cập nhật `renderProducts` (`tiktok-product-manager/client/js/modules/uiRender.js`):**
    *   Tìm dòng mã hiển thị `created_at` cho thẻ sản phẩm chính.
    *   Thay thế việc gọi `new Date(...).toLocaleString('vi-VN')` bằng cách gọi hàm mới `formatRelativeCreatedAt(product.created_at)`.

3.  **Cập nhật `renderDashboardStats` (`tiktok-product-manager/client/js/modules/uiRender.js`):**
    *   Tìm dòng mã hiển thị `created_at` cho các sản phẩm trong phần "Sản phẩm gần đây".
    *   Thay thế việc gọi `new Date(...).toLocaleString('vi-VN')` bằng cách gọi hàm mới `formatRelativeCreatedAt(product.created_at)`.

**Sơ đồ logic hàm `formatRelativeCreatedAt` (Mermaid):**
```mermaid
graph TD
    A[Bắt đầu: nhận dateString] --> B{dateString hợp lệ?};
    B -- Không --> C[Trả về 'N/A'];
    B -- Có --> D[Tạo đối tượng Date: inputDate];
    D --> E[Lấy thời gian hiện tại: now];
    E --> F[Chuẩn hóa inputDate về 00:00:00: dateOnly];
    E --> G[Chuẩn hóa now về 00:00:00: todayOnly];
    F & G --> H[Tính số ngày chênh lệch: diffDays];
    H --> I{diffDays == 0?};
    I -- Có --> J[Lấy timeString từ inputDate];
    J --> K[Trả về "Hôm nay, " + timeString];
    I -- Không --> L{diffDays == 1?};
    L -- Có --> M[Lấy timeString từ inputDate];
    M --> N[Trả về "Hôm qua, " + timeString];
    L -- Không --> O{diffDays <= 7?};
    O -- Có --> P[Lấy timeString từ inputDate];
    P --> Q[Trả về diffDays + " ngày trước, " + timeString];
    O -- Không --> R[Định dạng đầy đủ: fullDateTimeString];
    R --> S[Trả về fullDateTimeString];
    C --> T[Kết thúc];
    K --> T;
    N --> T;
    Q --> T;
    S --> T;
```

**Các bước thực hiện (trong chế độ Code):**

1.  Sử dụng `apply_diff` hoặc `insert_content` để thêm hàm `formatRelativeCreatedAt` vào `uiRender.js`.
2.  Sử dụng `apply_diff` để cập nhật hàm `renderProducts` trong `uiRender.js`.
3.  Sử dụng `apply_diff` để cập nhật hàm `renderDashboardStats` trong `uiRender.js`.