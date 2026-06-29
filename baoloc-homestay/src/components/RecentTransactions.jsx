import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';

const RecentTransactions = () => {
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      try {
        const resBookings = await axios.get('http://localhost:5000/api/admin/orders/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const allBookings = resBookings.data.data || resBookings.data || [];
        setRecentBookings(allBookings.slice(0, 5));
      } catch (error) {
        console.error("Lỗi lấy dữ liệu giao dịch gần đây:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'pending' || status === 'awaiting_confirmation') {
      return <span className="status-badge" style={{ backgroundColor: '#fef9c3', color: '#a16207', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Chờ duyệt</span>;
    }
    if (status === 'confirmed' || status === 'paid' || status === 'checked_in' || status === 'completed') {
      return <span className="status-badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Thành công</span>;
    }
    if (status === 'cancelled') {
      return <span className="status-badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Đã hủy</span>;
    }
    return <span className="status-badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{status}</span>;
  };

  if (loading) return null;

  return (
    <div className="dashboard-card" style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#3b82f6" /> Giao dịch gần đây
        </h2>
        <button 
          style={{ fontSize: '0.85rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
          onClick={() => {
            const btn = document.querySelector('.nav-btn:nth-child(7)');
            if (btn) btn.click();
          }} 
        >
          Xem tất cả <ArrowRight size={14} />
        </button>
      </div>

      {recentBookings.length > 0 ? (
        <div className="table-responsive">
          <table className="admin-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#f8fafc', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left' }}>Mã Đơn</th>
                <th style={{ backgroundColor: '#f8fafc', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left' }}>Khách Hàng</th>
                <th style={{ backgroundColor: '#f8fafc', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left' }}>Homestay</th>
                <th style={{ backgroundColor: '#f8fafc', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left' }}>Tổng Tiền</th>
                <th style={{ backgroundColor: '#f8fafc', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id || booking.bookingId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#334155' }}>#{booking.bookingId || booking.id}</td>
                  <td style={{ padding: '16px', color: '#475569' }}>{booking.userEmail || `User #${booking.user_id}`}</td>
                  <td style={{ padding: '16px', color: '#475569' }}>{booking.homestayName || booking.hotel_name || 'N/A'}</td>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{(booking.amount || booking.total_amount || 0).toLocaleString('vi-VN')} ₫</td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(booking.status || booking.payment_status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Chưa có giao dịch nào gần đây.</div>
      )}
    </div>
  );
};

export default RecentTransactions;
