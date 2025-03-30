// ==================================
// --- Trash Event Handlers Module ---
// ==================================

import { restoreProduct, permanentDeleteProduct } from './api.js';
import { loadTrashList } from './dataLoaders.js'; // Assuming loadTrashList is here

// Handler for restoring a product from trash
export async function handleRestoreProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn khôi phục sản phẩm này?')) return;
    try {
        await restoreProduct(productId);
        await loadTrashList(); // Refresh trash list
        alert('Sản phẩm đã được khôi phục thành công.');
    } catch (error) {
        alert(error.message || 'Khôi phục sản phẩm thất bại.');
    }
}

// Handler for permanently deleting a product
export async function handlePermanentDeleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác.')) return;
    try {
        await permanentDeleteProduct(productId);
        await loadTrashList(); // Refresh trash list
        alert('Sản phẩm đã bị xóa vĩnh viễn.');
    } catch (error) {
        alert(error.message || 'Xóa vĩnh viễn sản phẩm thất bại.');
    }
}