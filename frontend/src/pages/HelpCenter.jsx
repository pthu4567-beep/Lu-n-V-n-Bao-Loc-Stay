import Header from '../components/Header';
import Footer from '../components/Footer';
import './StaticPage.css';

const HelpCenter = () => {
  return (
    <div className="static-page-wrapper">
      <Header />
      <div className="container static-page-content">
        <h1>Trung tâm trợ giúp</h1>
        <div className="static-glass-panel">
          <h3>Bạn cần giúp đỡ điều gì?</h3>
          <p>Chào mừng bạn đến với trung tâm trợ giúp của BaoLoc Stay. Tại đây, bạn có thể tìm thấy các thông tin cần thiết để sử dụng nền tảng của chúng tôi một cách tốt nhất.</p>
          <ul style={{ marginTop: '20px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Làm thế nào để đặt phòng?</li>
            <li>Cách thanh toán an toàn.</li>
            <li>Thay đổi thông tin đặt phòng.</li>
            <li>Liên hệ trực tiếp với chủ Homestay.</li>
          </ul>
          <p style={{ marginTop: '20px' }}>Nếu bạn không tìm thấy câu trả lời, hãy liên hệ hotline: <strong>0354767628</strong>.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpCenter;
