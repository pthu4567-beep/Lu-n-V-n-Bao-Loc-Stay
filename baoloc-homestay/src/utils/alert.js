import Swal from 'sweetalert2';

// Cấu hình chung cho Toast
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

/**
 * Hiển thị thông báo dạng Toast (không che màn hình)
 * @param {string} title - Tiêu đề thông báo
 * @param {'success' | 'error' | 'warning' | 'info' | 'question'} icon - Biểu tượng
 */
export const showToast = (title, icon = 'success') => {
  return Toast.fire({
    icon,
    title
  });
};

/**
 * Hiển thị thông báo dạng Modal ở giữa màn hình
 * @param {string} title - Tiêu đề thông báo
 * @param {string} text - Nội dung chi tiết
 * @param {'success' | 'error' | 'warning' | 'info' | 'question'} icon - Biểu tượng
 */
export const showAlert = (title, text = '', icon = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: 'Đóng',
    confirmButtonColor: '#0ea5e9', // var(--primary-500)
    background: '#ffffff', // var(--bg-surface)
    color: '#0f172a', // var(--text-primary)
    backdrop: `rgba(15, 23, 42, 0.4)`,
    customClass: {
      confirmButton: 'btn btn-primary'
    }
  });
};

/**
 * Hiển thị hộp thoại Xác nhận (Confirm)
 * @param {string} title - Tiêu đề thông báo
 * @param {string} text - Nội dung chi tiết
 * @param {string} confirmText - Chữ trên nút Đồng ý
 * @param {string} cancelText - Chữ trên nút Hủy
 */
export const showConfirm = (title, text = '', confirmText = 'Đồng ý', cancelText = 'Hủy') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#0ea5e9',
    cancelButtonColor: '#ef4444',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    background: '#ffffff',
    color: '#0f172a',
    backdrop: `rgba(15, 23, 42, 0.4)`,
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-danger'
    }
  });
};
