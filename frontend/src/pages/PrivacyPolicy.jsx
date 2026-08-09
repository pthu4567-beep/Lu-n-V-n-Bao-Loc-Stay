import Header from '../components/Header';
import Footer from '../components/Footer';
import './StaticPage.css';

const PrivacyPolicy = () => {
  return (
    <div className="static-page-wrapper">
      <Header />
      <div className="container static-page-content">
        <h1>Chính sách bảo mật</h1>
        <div className="static-glass-panel">
          <h3>1. Thu thập thông tin cá nhân</h3>
          <p>Chúng tôi thu thập các thông tin như Họ tên, Số điện thoại, Email khi bạn đăng ký tài khoản và đặt phòng để đảm bảo chất lượng dịch vụ tốt nhất.</p>
          
          <h3 style={{ marginTop: '20px' }}>2. Sử dụng thông tin</h3>
          <p>Thông tin của khách hàng chỉ được sử dụng trong việc liên hệ xác nhận đặt phòng, gửi thông báo khuyến mãi (nếu bạn đồng ý), và hỗ trợ khi có sự cố phát sinh.</p>
          
          <h3 style={{ marginTop: '20px' }}>3. Bảo mật dữ liệu</h3>
          <p>Mật khẩu của bạn được mã hóa hoàn toàn. Chúng tôi cam kết không chia sẻ dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
