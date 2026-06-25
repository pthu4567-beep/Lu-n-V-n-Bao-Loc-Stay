import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, Flame, Coffee, Wifi, Wind } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { showAlert } from '../utils/alert';
import './Detail.css';

const Detail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [hotel, setHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form Đặt phòng
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gọi API lấy thông tin homestay (Có hỗ trợ cập nhật số phòng trống theo ngày chọn)
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/homestays/${id}?checkIn=${checkIn}&checkOut=${checkOut}`);
        setHotel(response.data);
      } catch (err) {
        console.error('Lỗi khi tải chi tiết:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, checkIn, checkOut]);

  // Kết nối socket.io real-time
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('room_update', (data) => {
      // Chỉ cập nhật lại nếu homestay hiện tại vừa có thay đổi
      if (parseInt(data.hotelId) === parseInt(id)) {
        const refetchDetail = async () => {
          try {
            const response = await axios.get(`http://localhost:5000/api/homestays/${id}?checkIn=${checkIn}&checkOut=${checkOut}`);
            setHotel(response.data);
          } catch (err) {
            console.error('Lỗi tải lại thông tin homestay:', err);
          }
        };
        refetchDetail();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, checkIn, checkOut]);
  
  const handleBooking = async () => {
    if (!selectedRoom) {
      await showAlert('Chưa chọn phòng', 'Vui lòng chọn loại phòng trước khi tiến hành đặt!', 'warning');
      return;
    }
    if (!checkIn || !checkOut) {
      await showAlert('Thiếu ngày', 'Vui lòng chọn ngày Nhận và Trả phòng!', 'warning');
      return;
    }

    // Kiểm tra tính hợp lệ của ngày
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (inDate >= outDate) {
        await showAlert('Ngày không hợp lệ', 'Ngày trả phòng phải sau ngày nhận phòng!', 'warning');
        return;
    }

    // Tính tổng số ngày lưu trú
    const diffTime = Math.abs(outDate - inDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalAmount = diffDays * selectedRoom.price;

    const storedUser = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    if (!storedUser || !token) {
        await showAlert('Chưa đăng nhập', 'Vui lòng đăng nhập trước khi tiến hành đặt phòng!', 'warning');
        return navigate('/auth');
    }
    const loggedInUser = JSON.parse(storedUser);

    setIsSubmitting(true);
    try {
        const payload = {
            userId: loggedInUser.id, 
            hotelId: hotel.id,
            roomTypeId: selectedRoom.id,
            checkIn: checkIn,
            checkOut: checkOut,
            totalAmount: totalAmount,
            guestCount: guestCount
        };

        const res = await axios.post('http://localhost:5000/api/bookings', payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (res.data.success) {
            // Chuyển hướng sang trang thanh toán kèm thông tin
            navigate(`/checkout/${res.data.bookingId}?amount=${totalAmount}&hotel=${hotel.name}&room=${selectedRoom.type}`);
        }
    } catch (err) {
        const errorMsg = err.response?.data?.error || "Có lỗi xảy ra khi tạo đơn đặt phòng";
        await showAlert('Lỗi đặt phòng', errorMsg, 'error'); // Hiển thị lỗi "Phòng vừa được đặt..."
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="container" style={{padding: '5rem 0', textAlign: 'center'}}>Đang tải dữ liệu homestay...</div>;
  if (!hotel) return <div className="container" style={{padding: '5rem 0', textAlign: 'center'}}>Không tìm thấy Homestay này!</div>;

  return (
    <div className="detail-page container">
      {/* Gallery */}
      <div className="gallery-bento">
        <div className="gallery-main">
          <img src={hotel.images[0]} alt="Main" />
        </div>
        <div className="gallery-side">
          {hotel.images[1] && <img src={hotel.images[1]} alt="Sub 1" />}
          {hotel.images[2] && (
            <div className="gallery-more">
                <img src={hotel.images[2]} alt="Sub 2" />
                {hotel.images.length > 3 && <div className="more-overlay">+{hotel.images.length - 3} ẢNH</div>}
            </div>
          )}
        </div>
      </div>

      <div className="detail-layout">
        {/* Left Column - Info */}
        <div className="detail-info">
          <div className="info-header">
            <h1>{hotel.name}</h1>
            <div className="meta-info">
              <span className="card-rating">
                <Star size={16} fill="currentColor" /> 
                {hotel.reviewsList && hotel.reviewsList.length > 0 ? 
                  (hotel.reviewsList.reduce((acc, curr) => acc + curr.rating_score, 0) / hotel.reviewsList.length).toFixed(1) 
                  : '4.5'} 
                ({hotel.reviewsList ? hotel.reviewsList.length : 124} đánh giá)
              </span>
              <span className="address"><MapPin size={16} /> {hotel.address}</span>
            </div>
          </div>

          <div className="section">
            <h2>Giới thiệu</h2>
            <p className="description">{hotel.description || "Chưa có mô tả"}</p>
          </div>

          <div className="section">
            <h2>Tiện ích chung</h2>
            <p style={{color: '#666', marginBottom: '1rem'}}>{hotel.facilities_text}</p>
            <div className="facilities-grid">
              <div className="facility-item"><Flame size={20} /> Lò sưởi</div>
              <div className="facility-item"><Wifi size={20} /> Wifi tốc độ cao</div>
              <div className="facility-item"><Wind size={20} /> Không gian mở</div>
            </div>
          </div>

          <div className="section">
            <h2>Loại phòng hiện có</h2>
            <div className="rooms-list">
              {hotel.rooms.map(room => (
                <div className={`room-card ${selectedRoom?.id === room.id ? 'selected' : ''}`} key={room.id}>
                  <div className="room-info">
                    <h3>{room.type}</h3>
                    <p>Sức chứa: {room.adult_capacity} người lớn{room.child_capacity > 0 ? `, ${room.child_capacity} trẻ em` : ''} ({room.capacity} khách)</p>
                    <p style={{fontSize: '0.85rem', color: 'var(--primary-600)', marginTop: '4px'}}>{room.room_amenities_text}</p>
                    {room.available > 0 ? (
                        <p style={{color: 'var(--status-confirmed)', fontWeight: 500}}>Còn {room.available} phòng trống</p>
                    ) : (
                        <p style={{color: 'var(--status-danger)', fontWeight: 500}}>Đã hết phòng loại này</p>
                    )}
                  </div>
                  <div className="room-action">
                    <div className="room-price">
                      <strong>{room.price.toLocaleString('vi-VN')} ₫</strong>/đêm
                    </div>
                    <button 
                      className={`btn ${selectedRoom?.id === room.id ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => room.available > 0 && setSelectedRoom(room)}
                      disabled={room.available === 0}
                    >
                      {room.available === 0 ? 'Hết phòng' : selectedRoom?.id === room.id ? 'Đã chọn' : 'Chọn phòng'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h2>Đánh giá từ khách hàng</h2>
            {hotel.reviewsList && hotel.reviewsList.length > 0 ? (
              <div className="reviews-list">
                {hotel.reviewsList.map((rev, index) => (
                  <div key={index} className="review-card">
                    <div className="review-header">
                      <strong>{rev.email ? rev.email.split('@')[0] : 'Khách hàng'}</strong>
                      <span className="review-date">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="review-rating" style={{marginBottom: '0.5rem'}}>
                      {Array(rev.rating_score).fill().map((_, i) => <Star key={i} size={14} fill="#eab308" color="#eab308" style={{marginRight: '2px'}} />)}
                    </div>
                    <p className="review-comment">{rev.comment}</p>
                    {rev.reply_comment && (
                      <div className="review-reply">
                        <strong>Phản hồi từ {hotel.name}:</strong>
                        <p>{rev.reply_comment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px'}}>Chưa có đánh giá nào cho Homestay này.</p>
            )}
          </div>
        </div>

        {/* Right Column - Booking Widget */}
        <div className="booking-widget-wrapper">
          <div className="booking-widget glass-panel">
            <h3>Chi tiết đặt phòng</h3>
            <div className="widget-form">
              <div className="form-group">
                <label>Ngày Nhận phòng</label>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Ngày Trả phòng</label>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Số lượng khách</label>
                <input type="number" min="1" max={selectedRoom ? selectedRoom.capacity : 10} value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value))} />
              </div>
              
              <div className="widget-summary">
                <div className="summary-row">
                  <span>Loại phòng:</span>
                  <strong>{selectedRoom ? selectedRoom.type : 'Chưa chọn'}</strong>
                </div>
                <div className="summary-row total">
                  <span>Giá 1 đêm:</span>
                  <strong>{selectedRoom ? `${selectedRoom.price.toLocaleString('vi-VN')} ₫` : '0 ₫'}</strong>
                </div>
              </div>

              <button 
                className="btn btn-primary w-full cta-btn"
                onClick={handleBooking}
                disabled={isSubmitting || !selectedRoom}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Tiến hành Đặt phòng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
