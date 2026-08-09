import Header from '../components/Header';
import Footer from '../components/Footer';
import './StaticPage.css';

const CancellationPolicy = () => {
  return (
    <div className="static-page-wrapper">
      <Header />
      <div className="container static-page-content">
        <h1>Quy định hủy phòng</h1>
        <div className="static-glass-panel">
          <h3>Quy định chung về hoàn/hủy phòng</h3>
          <p>BaoLoc Stay áp dụng chính sách hủy phòng linh hoạt nhằm tạo điều kiện tốt nhất cho khách hàng, tuy nhiên để đảm bảo quyền lợi cho chủ Homestay, vui lòng tuân thủ các mốc thời gian sau:</p>
          
          <ul style={{ marginTop: '20px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Hủy trước 3 ngày (72 giờ) (tính từ giờ check-in):</strong> Hoàn 100% tiền cọc.</li>
            <li><strong>Hủy từ 1 - 3 ngày (24 giờ - 72 giờ):</strong> Hoàn 50% tiền cọc.</li>
            <li><strong>Hủy dưới 1 ngày (24 giờ):</strong> Không hoàn tiền cọc.</li>
            <li><strong>Không đến (No-show):</strong> Không hoàn tiền và phải thanh toán 100% giá trị phòng (đối với một số cơ sở áp dụng phạt).</li>
          </ul>
          <p style={{ marginTop: '20px' }}>* Lưu ý: Các ngày Lễ/Tết có thể áp dụng chính sách hủy phòng nghiêm ngặt hơn tùy theo quy định của từng Homestay cụ thể.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CancellationPolicy;
