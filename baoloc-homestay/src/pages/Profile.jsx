import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, History, LogOut, Star, CheckCircle, AlertCircle, AlertTriangle, Clock, CreditCard, Trash2, Edit, Receipt } from 'lucide-react';
import axios from 'axios';
import './Profile.css';

const formatLocalDateOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(typeof dateString === 'string' ? dateString.replace('Z', '') : dateString);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('history');
  const [reviewingBookingId, setReviewingBookingId] = useState(null);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewText, setReviewText] = useState('');
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, bookingId: null });
  const [earlyCheckoutDialog, setEarlyCheckoutDialog] = useState({ isOpen: false, bookingId: null });
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: '', phone: '' });

  // Lấy thông tin user đăng nhập từ sessionStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      // Nếu chưa đăng nhập, chuyển về trang auth
      navigate('/auth');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEditProfileData({
        full_name: parsedUser.full_name || '',
        phone: parsedUser.phone || ''
      });
    }
  }, [navigate]);

  // Gọi API lấy lịch sử đặt phòng động cho user từ Backend (Dùng JWT)
  useEffect(() => {
    if (activeTab === 'history') {
      const fetchBookings = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        try {
          const res = await axios.get('http://localhost:5000/api/users/my-bookings', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setBookings(res.data);
        } catch (err) {
          console.error('Lỗi khi tải lịch sử:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchBookings();
    }
  }, [activeTab]);

  const handleCancelBooking = (bookingId) => {
    setConfirmDialog({ isOpen: true, bookingId });
  };

  const confirmCancelBooking = async (bookingId) => {
    setConfirmDialog({ isOpen: false, bookingId: null });
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotification({ isOpen: true, message: res.data.message, type: 'success' });
        // Cập nhật lại danh sách bookings
        setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      }
    } catch (err) {
      setNotification({ isOpen: true, message: err.response?.data?.error || "Có lỗi xảy ra khi hủy đặt phòng", type: 'error' });
    }
  };

  const handleEarlyCheckout = (bookingId) => {
    setEarlyCheckoutDialog({ isOpen: true, bookingId });
  };

  const confirmEarlyCheckout = async (bookingId) => {
    setEarlyCheckoutDialog({ isOpen: false, bookingId: null });
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/bookings/${bookingId}/early-checkout`, {
        new_checkout_datetime: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setNotification({ 
          isOpen: true, 
          message: `Thành công! Số tiền hoàn dự kiến: ${res.data.data.refundAmount.toLocaleString('vi-VN')} đ`, 
          type: 'success' 
        });
        // Cập nhật trạng thái thành refund_pending
        setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'refund_pending' } : b));
      }
    } catch (err) {
      setNotification({ isOpen: true, message: err.response?.data?.message || err.response?.data?.error || "Lỗi khi yêu cầu trả phòng sớm", type: 'error' });
    }
  };

  const handleSubmitReview = async () => {
    const token = sessionStorage.getItem('token');
    if (!token || !reviewingBookingId) return;

    if (reviewScore < 1) {
      setNotification({ isOpen: true, message: "Vui lòng chọn số sao đánh giá!", type: 'error' });
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/bookings/${reviewingBookingId}/reviews`, {
        rating: reviewScore,
        comment: reviewText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setNotification({ isOpen: true, message: res.data.message, type: 'success' });
        // Cập nhật state has_review
        setBookings(bookings.map(b => b.id === reviewingBookingId ? { ...b, has_review: 1 } : b));
        setReviewingBookingId(null);
        setReviewScore(0);
        setReviewText('');
      }
    } catch (err) {
      setNotification({ isOpen: true, message: err.response?.data?.message || err.response?.data?.error || "Có lỗi xảy ra khi gửi đánh giá", type: 'error' });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/auth');
  };

  const handleSaveProfile = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.put('http://localhost:5000/api/users/profile', editProfileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUser(res.data.user);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        setIsEditingProfile(false);
        setNotification({ isOpen: true, message: res.data.message, type: 'success' });
      }
    } catch (err) {
      setNotification({ isOpen: true, message: err.response?.data?.error || "Có lỗi xảy ra khi cập nhật hồ sơ", type: 'error' });
    }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'pending_payment': return { text: 'Chờ thanh toán', class: 'status-pending' };
      case 'awaiting_confirmation': return { text: 'Chờ Admin duyệt', class: 'status-pending' };
      case 'confirmed': return { text: 'Đã xác nhận', class: 'status-confirmed' };
      case 'checked_in': return { text: 'Đang sử dụng', class: 'status-confirmed' };
      case 'refund_pending': return { text: 'Yêu cầu Trả phòng sớm', class: 'status-pending' };
      case 'checked_out': return { text: 'Đã trả phòng', class: 'status-confirmed' };
      case 'completed': return { text: 'Đã hoàn tất', class: 'status-confirmed' };
      case 'cancelled': return { text: 'Đã hủy', class: 'status-cancelled' };
      default: return { text: status, class: '' };
    }
  };

  if (!user) return <div className="container" style={{padding: '5rem 0', textAlign: 'center'}}>Đang chuyển hướng...</div>;

  const emailInitial = user.full_name ? user.full_name.substring(0, 2).toUpperCase() : (user.email ? user.email.substring(0, 2).toUpperCase() : 'US');
  const displayUsername = user.full_name || (user.email ? user.email.split('@')[0] : 'Khách Hàng');

  return (
    <div className="profile-page container">
      <div className="profile-layout">
        <aside className="profile-sidebar glass-panel">
          <div className="user-avatar-lg">
            <div className="avatar-circle">{emailInitial}</div>
            <h2>{displayUsername}</h2>
            <p>{user.email}</p>
          </div>
          
          <nav className="profile-nav">
            <button 
              className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} /> Hồ sơ cá nhân
            </button>
            <button 
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={18} /> Lịch sử đặt phòng
            </button>
            <button className="nav-btn text-danger" onClick={handleLogout}>
              <LogOut size={18} /> Đăng xuất
            </button>
          </nav>
        </aside>

        <main className="profile-content glass-panel">
          {activeTab === 'profile' && (
            <div className="tab-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Hồ sơ cá nhân</h2>
                {!isEditingProfile ? (
                  <button className="btn btn-primary" onClick={() => setIsEditingProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Edit size={16} /> Chỉnh sửa
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline" onClick={() => {
                      setIsEditingProfile(false);
                      setEditProfileData({ full_name: user.full_name || '', phone: user.phone || '' });
                    }}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSaveProfile} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={16} /> Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>
              <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Họ và Tên</label>
                  {isEditingProfile ? (
                    <input type="text" value={editProfileData.full_name} onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} placeholder="Nhập họ và tên" />
                  ) : (
                    <input type="text" value={user.full_name || displayUsername} readOnly style={{ backgroundColor: '#f8fafc', color: '#64748b' }} />
                  )}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user.email} disabled title="Email không thể thay đổi" />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  {isEditingProfile ? (
                    <input type="tel" value={editProfileData.phone} onChange={e => setEditProfileData({...editProfileData, phone: e.target.value})} placeholder="Nhập số điện thoại" />
                  ) : (
                    <input type="tel" value={user.phone || 'Chưa cập nhật'} readOnly style={{ backgroundColor: '#f8fafc', color: '#64748b' }} />
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="tab-pane">
              <h2>Lịch sử đặt phòng</h2>
              {loading ? (
                <p>Đang tải dữ liệu...</p>
              ) : (
                <div className="booking-list">
                  {bookings.map(booking => {
                    const statusConf = getStatusConfig(booking.status);
                    return (
                      <div className="booking-card" key={booking.id}>
                        <div className="booking-header">
                          <span className="booking-id">Mã Đơn: #{booking.id}</span>
                          <span className={`status-badge ${statusConf.class}`}>{statusConf.text}</span>
                        </div>
                        
                        <div className="booking-body">
                          <div className="b-info">
                            <h3>{booking.homestay}</h3>
                            <p>{booking.room} • Ngày đặt: {formatLocalDateOnly(booking.date)}</p>
                          </div>
                          <div className="b-price">
                            <strong>{booking.total.toLocaleString('vi-VN')} ₫</strong>
                          </div>
                        </div>

                        <div className="booking-footer" style={{ display: 'flex', gap: '10px' }}>
                          {(booking.status === 'completed' || booking.status === 'checked_out') && (
                            <>
                              {!booking.has_review ? (
                                <button 
                                  className="btn btn-sm action-btn"
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', transition: 'all 0.2s' }}
                                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; }}
                                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
                                  onClick={() => {
                                    setReviewingBookingId(booking.id);
                                    setReviewScore(0);
                                    setReviewText('');
                                  }}
                                >
                                  <Edit size={16} /> Viết đánh giá
                                </button>
                              ) : (
                                <button className="btn btn-sm action-btn" disabled style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', backgroundColor: '#f1f5f9', color: '#94a3b8', border: 'none', cursor: 'not-allowed' }}>
                                  <CheckCircle size={16} /> Đã đánh giá
                                </button>
                              )}
                            </>
                          )}
                          {booking.status === 'pending_payment' && (
                            <button 
                              className="btn btn-sm action-btn" 
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)', transition: 'all 0.2s', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
                              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                              onClick={() => navigate(`/checkout/${booking.id}?amount=${booking.total}&hotel=${booking.homestay}`)}
                            >
                              <CreditCard size={16} /> Thanh toán ngay
                            </button>
                          )}
                          {booking.status === 'checked_in' && new Date() <= new Date(booking.check_out_datetime) && (
                            <button 
                              className="btn btn-sm action-btn" 
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', boxShadow: '0 2px 4px rgba(249, 115, 22, 0.15)', transition: 'all 0.2s', border: 'none', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white' }} 
                              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                              onClick={() => handleEarlyCheckout(booking.id)}
                            >
                              <Clock size={16} /> Trả phòng sớm
                            </button>
                          )}
                          {(booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'checked_out' && booking.status !== 'refund_pending') && 
                           (booking.status !== 'checked_in' || new Date() > new Date(booking.check_out_datetime)) && (
                            <button 
                              className="btn btn-sm action-btn text-danger" 
                              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#ef4444', transition: 'all 0.2s' }} 
                              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; }}
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              <Trash2 size={16} /> Hủy phòng
                            </button>
                          )}
                          {booking.status !== 'pending_payment' && booking.status !== 'cancelled' && (
                            <button 
                              className="btn btn-sm action-btn" 
                              style={{ marginLeft: (booking.status === 'completed' || booking.status === 'checked_out' || booking.status === 'refund_pending' || (booking.status === 'checked_in' && new Date() <= new Date(booking.check_out_datetime))) ? 'auto' : '0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#2563eb', transition: 'all 0.2s' }} 
                              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                              onClick={() => navigate(`/invoice/${booking.id}`)}
                            >
                              <Receipt size={16} /> Hóa đơn
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {bookings.length === 0 && <p>Chưa có lịch sử đặt phòng nào.</p>}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {reviewingBookingId && (
        <div className="modal-overlay" onClick={() => setReviewingBookingId(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h3>Đánh giá trải nghiệm</h3>
            
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star}
                  className={`star-btn ${reviewScore >= star ? 'active' : ''}`}
                  onClick={() => setReviewScore(star)}
                >
                  <Star size={32} fill={reviewScore >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>

            <textarea 
              placeholder="Chia sẻ cảm nhận của bạn về kỳ nghỉ..." 
              rows="4"
              className="review-textarea"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            ></textarea>

            <div className="modal-actions">
              <button className="btn" onClick={() => setReviewingBookingId(null)}>Hủy</button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitReview}
              >
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal for Cancel */}
      {confirmDialog.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmDialog({ isOpen: false, bookingId: null })}>
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <AlertTriangle size={48} color="var(--status-pending)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Xác nhận hủy phòng</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>Bạn có chắc chắn muốn hủy đơn đặt phòng này không? Hành động này không thể hoàn tác.</p>
            <div className="modal-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" style={{ flex: 1, backgroundColor: '#f1f5f9' }} onClick={() => setConfirmDialog({ isOpen: false, bookingId: null })}>Không, giữ lại</button>
              <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--status-danger)', border: 'none' }} onClick={() => confirmCancelBooking(confirmDialog.bookingId)}>Có, hủy phòng</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal for Early Checkout */}
      {earlyCheckoutDialog.isOpen && (
        <div className="modal-overlay" onClick={() => setEarlyCheckoutDialog({ isOpen: false, bookingId: null })}>
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <AlertCircle size={48} color="#f97316" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Yêu cầu trả phòng sớm</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>Bạn có muốn gửi yêu cầu trả phòng sớm ngay bây giờ không? Hệ thống sẽ tính toán số tiền hoàn lại dựa trên thời gian còn lại của bạn.</p>
            <div className="modal-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" style={{ flex: 1, backgroundColor: '#f1f5f9' }} onClick={() => setEarlyCheckoutDialog({ isOpen: false, bookingId: null })}>Hủy</button>
              <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#f97316', border: 'none' }} onClick={() => confirmEarlyCheckout(earlyCheckoutDialog.bookingId)}>Có, xác nhận gửi</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification.isOpen && (
        <div className="modal-overlay" onClick={() => setNotification({ ...notification, isOpen: false })}>
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            {notification.type === 'success' ? (
              <CheckCircle size={48} color="var(--status-confirmed)" style={{ margin: '0 auto 1rem' }} />
            ) : (
              <AlertCircle size={48} color="var(--status-danger)" style={{ margin: '0 auto 1rem' }} />
            )}
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>{notification.type === 'success' ? 'Thành công' : 'Thông báo'}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{notification.message}</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setNotification({ ...notification, isOpen: false })}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
