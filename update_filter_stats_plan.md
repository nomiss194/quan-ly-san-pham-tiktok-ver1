# Kế hoạch: Cập nhật số liệu và ẩn Card khi đổi trạng thái trong lúc lọc

**Mục tiêu:** Khi người dùng thay đổi trạng thái sản phẩm (Đang chờ <-> Đã mua) trong lúc đang áp dụng bộ lọc theo trạng thái, sản phẩm sẽ được ẩn đi nếu không còn khớp bộ lọc, và số đếm trên các nút lọc ("Tổng", "Đang chờ", "Đã mua") sẽ được cập nhật chính xác từ dữ liệu server mà không cần tải lại trang.

**Luồng xử lý chính:**

1.  **Client:** Người dùng click vào nút trạng thái trên card sản phẩm.
2.  **Client:** Hàm xử lý sự kiện (`handleProductListActions`) được kích hoạt.
3.  **Client:** Gửi yêu cầu API `PUT /api/products/:id` đến server với trạng thái mới.
4.  **Backend:** Hàm `updateProduct` xử lý yêu cầu:
    *   Cập nhật trạng thái sản phẩm trong database.
    *   **Tính toán lại** tổng số sản phẩm "Đang chờ" và "Đã mua" của người dùng.
    *   Trả về thông tin sản phẩm đã cập nhật **kèm theo số liệu thống kê mới (`stats`)**.
5.  **Client:** Nhận phản hồi thành công từ API (bao gồm `product` và `stats`).
6.  **Client:** Cập nhật giao diện của nút trạng thái vừa click (dựa trên `product.purchased` trả về).
7.  **Client:** **Cập nhật số đếm** trên các nút lọc ("Tổng", "Đang chờ", "Đã mua") dựa trên đối tượng `stats` nhận được từ API.
8.  **Client:** **Kiểm tra bộ lọc trạng thái** đang hoạt động trên giao diện.
9.  **Client:** Nếu có bộ lọc trạng thái đang hoạt động và trạng thái mới của sản phẩm không khớp với bộ lọc đó, **ẩn card sản phẩm** tương ứng đi.

**I. Sửa đổi Backend (Server-side)**

*   **File:** `tiktok-product-manager/server/controllers/productController.js`
*   **Hàm:** `updateProduct`
*   **Chi tiết:**
    *   Sau khi cập nhật sản phẩm thành công (`product.update()` và `product.setTags()` nếu có).
    *   Thêm logic truy vấn `Product.count()` để lấy số lượng `pendingCount` (`purchased: false`) và `purchasedCount` (`purchased: true`) cho `user_id` hiện tại (và `deleted_at: null`).
    *   Tính `totalCount = pendingCount + purchasedCount`.
    *   Sửa đổi cấu trúc JSON trả về để bao gồm cả thông tin sản phẩm đã cập nhật và đối tượng `stats` chứa 3 số đếm này.
    ```javascript
    // Ví dụ đoạn code thêm vào trước res.json(...)
    const [pendingCount, purchasedCount] = await Promise.all([
        Product.count({ where: { user_id: userId, deleted_at: null, purchased: false } }),
        Product.count({ where: { user_id: userId, deleted_at: null, purchased: true } })
    ]);
    const totalCount = pendingCount + purchasedCount;

    const finalUpdatedProduct = await Product.findByPk(id, { include: [Tag] });

    res.json({
      product: finalUpdatedProduct,
      stats: {
        total: totalCount,
        pending: pendingCount,
        purchased: purchasedCount
      }
    });
    ```

**II. Sửa đổi Frontend (Client-side)**

*   **File:** `tiktok-product-manager/client/js/modules/productHandlers.js`
*   **Hàm:** `handleProductListActions` (trong khối `else if (action === 'toggle-purchase')`)
*   **Chi tiết:**
    1.  **Lưu kết quả API:** Sau `await updateProduct(...)`, lưu kết quả vào biến `updateResult`.
    2.  **Cập nhật UI nút trạng thái:** Sử dụng `updateResult.product.purchased` để lấy trạng thái mới nhất từ server và cập nhật `textContent`, `dataset.currentStatus`, và các lớp CSS (`stat-btn-pending`, `stat-btn-purchased`) cho phần tử trạng thái (`actionElement`).
    3.  **Cập nhật số đếm:**
        *   Kiểm tra sự tồn tại của `updateResult.stats`.
        *   Lấy các phần tử DOM: `#stat-total-count`, `#stat-pending-count`, `#stat-purchased-count`.
        *   Cập nhật `textContent` của các phần tử này bằng giá trị từ `updateResult.stats.total`, `updateResult.stats.pending`, `updateResult.stats.purchased`.
    4.  **Ẩn Card:**
        *   Tìm nút lọc trạng thái đang active: `document.querySelector('.stat-filter-btn[data-active="true"]')`.
        *   Lấy `activeFilterStatus` từ `dataset.filterStatus` của nút đó (nếu có).
        *   Lấy phần tử card cha: `actionElement.closest('div.product-card')`.
        *   Nếu `productCard` tồn tại và `activeFilterStatus` có giá trị (không phải `null` hoặc `''`) và `String(updateResult.product.purchased)` không bằng `activeFilterStatus`, thì thêm class `hidden` vào `productCard`.
    5.  **Xóa bỏ:** Các lệnh gọi không cần thiết như `renderDashboardStats()` trong khối này.

**III. (Tùy chọn) Refactor:**

*   Có thể tạo hàm `updateStatCountUI(stats)` trong `uiRender.js` hoặc `productHandlers.js` để đóng gói logic cập nhật `textContent` cho các nút lọc, giúp code trong `handleProductListActions` gọn hơn.

---
Kế hoạch này đảm bảo số liệu thống kê chính xác và cải thiện trải nghiệm người dùng khi lọc.