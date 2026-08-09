import Header from '../components/Header';
import Footer from '../components/Footer';
import './StaticPage.css';

const FAQ = () => {
  return (
    <div className="static-page-wrapper">
      <Header />
      <div className="container static-page-content">
        <h1>Câu hỏi thường gặp (FAQ)</h1>
        <div className="static-glass-panel">
          
          <div style={{ marginBottom: '20px' }}>
            <h4>1. BaoLoc Stay có thu phí dịch vụ khi tôi đặt phòng không?</h4>
            <p>Không. BaoLoc Stay cam kết hiển thị giá cuối cùng từ chủ nhà, bạn không phải chịu thêm khoản phụ phí nền tảng nào.</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>2. Tôi có được phép mang theo thú cưng (chó/mèo) không?</h4>
            <p>Tùy thuộc vào chính sách của từng Homestay. Vui lòng xem kỹ mục "Tiện ích" trên trang chi tiết của homestay để biết họ có cho phép thú cưng hay không.</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>3. Giờ nhận phòng và trả phòng tiêu chuẩn là mấy giờ?</h4>
            <p>Thông thường giờ nhận phòng (Check-in) là 14:00 và trả phòng (Check-out) là 12:00 hôm sau. Nếu muốn check-in sớm hoặc check-out trễ, bạn cần trao đổi trước để xem phòng có trống không và có thể tính phụ phí.</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>4. Làm thế nào để áp dụng mã giảm giá?</h4>
            <p>Ở trang Thanh toán (Checkout), sẽ có ô "Mã Khuyến Mãi". Bạn chỉ cần nhập mã bạn có và nhấn "Áp dụng", hệ thống sẽ tự động trừ đi số tiền tương ứng.</p>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
