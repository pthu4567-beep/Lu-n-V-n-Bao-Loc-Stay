import { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, Sun, TreePine, Sparkles, Tag, Calendar } from 'lucide-react';
import { showToast } from '../utils/alert';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Home.css'; // Reuse some deal card styles

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/promotions');
        if (res.data.success) {
          setPromotions(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách khuyến mãi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const handleSaveVoucher = async (promotion_id) => {
    if (!isLoggedIn) {
      showToast('Vui lòng đăng nhập để lưu voucher!', 'error');
      return;
    }
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/promotions/save', 
        { promotion_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast('Đã lưu voucher vào Ví thành công!', 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Đã xảy ra lỗi khi lưu voucher';
      showToast(msg, 'error');
    }
  };

  const getIcon = (percent) => {
    if (percent >= 30) return <TreePine size={28} />;
    if (percent >= 20) return <Sparkles size={28} />;
    if (percent >= 15) return <Gift size={28} />;
    return <Sun size={28} />;
  };

  const getColor = (percent) => {
    if (percent >= 30) return { c: '#3b82f6', bg: '#dbeafe' };
    if (percent >= 20) return { c: '#ef4444', bg: '#fee2e2' };
    if (percent >= 15) return { c: '#8b5cf6', bg: '#ede9fe' };
    return { c: '#f59e0b', bg: '#fef3c7' };
  };

  return (
    <div className="promotions-page" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <main className="container" style={{ flex: 1, padding: '40px 15px', marginTop: '60px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e0e7ff', color: '#4f46e5', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
            <Tag size={16} /> Kho Voucher Siêu Ưu Đãi
          </div>
          <h1 style={{ fontSize: '32px', color: '#0f172a', fontWeight: '700', marginBottom: '16px' }}>Săn Khuyến Mãi – Đặt Phòng Thả Ga</h1>
          <p style={{ color: '#475569', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>Lưu ngay các mã giảm giá hấp dẫn nhất vào ví của bạn để sử dụng khi thanh toán. Số lượng có hạn!</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải mã khuyến mãi...</div>
        ) : (
          <div className="deals-grid">
            {promotions.map(promo => {
              const { c, bg } = getColor(promo.discount_percent);
              const validUntil = new Date(promo.valid_until);
              const formattedDate = `${validUntil.getDate().toString().padStart(2, '0')}/${(validUntil.getMonth() + 1).toString().padStart(2, '0')}/${validUntil.getFullYear()}`;
              
              return (
                <div className="deal-card" key={promo.id} style={{ '--deal-color': c, '--deal-bg': bg }}>
                  <div className="deal-discount">Giảm {promo.discount_percent}%</div>
                  <h3>{promo.hotel_id ? `Dành cho: ${promo.hotel_name}` : 'Áp dụng Toàn Hệ Thống'}</h3>
                  <p>Nhập mã <strong>{promo.discount_code}</strong> để được giảm ngay {promo.discount_percent}%.</p>
                  <div className="deal-period">
                    <Calendar size={14} /> Có hạn đến {formattedDate}
                  </div>
                  <button 
                    className="btn btn-outline deal-btn" 
                    onClick={() => handleSaveVoucher(promo.id)}
                  >
                    Lưu Voucher
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Promotions;
