import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, Flame, Coffee, Wifi, Wind } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { showAlert } from '../utils/alert';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Detail.css';

const parseAmenitiesImages = (text) => {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    return [text];
  } catch (e) {
    return text.split(',').filter(x => x.trim());
  }
};

const getRoomImages = (roomType) => {
  const defaultSets = [
    [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&h=250&q=80", // Giường ngủ
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&h=250&q=80", // Phòng tắm & bồn tắm (Tiện nghi)
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=400&h=250&q=80"  // Ban công / view ngoài trời
    ],
    [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&h=250&q=80", // Giường ngủ cao cấp
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=400&h=250&q=80", // Bồn tắm sang trọng (Tiện nghi)
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&h=250&q=80"  // Không gian sofa / uống trà
    ],
    [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&h=250&q=80", // Phòng 2 giường đôi
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=400&h=250&q=80", // Tiện nghi phòng tắm hiện đại
      "https://images.unsplash.com/photo-1533044309907-0fa34192bcbc?auto=format&fit=crop&w=400&h=250&q=80"  // Ghế thư giãn ngoài ban công
    ],
    [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&h=250&q=80", // Giường ngủ
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=400&h=250&q=80", // Tiện nghi bồn rửa mặt / phòng tắm
      "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?auto=format&fit=crop&w=400&h=250&q=80"  // View cửa sổ nhìn ra thiên nhiên
    ],
    [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&h=250&q=80", // Giường tiêu chuẩn
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&h=250&q=80", // Bồn tắm sứ (Tiện nghi)
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&h=250&q=80"  // Khu vực phòng khách mini
    ]
  ];

  if (!roomType) return defaultSets[0];

  const typeLower = roomType.toLowerCase();

  if (typeLower.includes('suite') || typeLower.includes('trăng mật') || typeLower.includes('honeymoon')) {
    return [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&h=250&q=80", // Bed
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=400&h=250&q=80", // Bathtub with view (Tiện nghi)
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=400&h=250&q=80"  // Romantic balcony view
    ];
  }
  if (typeLower.includes('villa') || typeLower.includes('biệt thự') || typeLower.includes('hồ bơi')) {
    return [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&h=250&q=80", // Villa room
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=400&h=250&q=80", // Hồ bơi riêng (Tiện nghi nổi bật)
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=400&h=250&q=80"  // Phòng tắm luxury
    ];
  }
  if (typeLower.includes('bungalow') || typeLower.includes('lều') || typeLower.includes('gỗ') || typeLower.includes('mây') || typeLower.includes('glamping')) {
    return [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&h=250&q=80", // Phòng ngủ ấm cúng
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&h=250&q=80", // Phòng tắm tiện nghi
      "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?auto=format&fit=crop&w=400&h=250&q=80"  // View thiên nhiên
    ];
  }
  if (typeLower.includes('gia đình') || typeLower.includes('family') || typeLower.includes('tập thể')) {
    return defaultSets[2]; 
  }
  
  if (typeLower.includes('superior') || typeLower.includes('vườn trà')) {
    return defaultSets[0];
  }

  // Thuật toán băm để lấy ngẫu nhiên 1 bộ ảnh cố định cho các tên phòng không khớp từ khóa
  let hash = 0;
  for (let i = 0; i < roomType.length; i++) {
    hash += roomType.charCodeAt(i);
  }
  
  return defaultSets[hash % defaultSets.length];
};

const Detail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [hotel, setHotel] = useState(null);
  const [selectedRooms, setSelectedRooms] = useState({}); // { roomTypeId: count }
  const [loading, setLoading] = useState(true);
  const [viewRoomDetail, setViewRoomDetail] = useState(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoomCountChange = (roomId, count, available) => {
    setSelectedRooms(prev => {
      const updated = { ...prev };
      if (count <= 0) {
        delete updated[roomId];
      } else if (count <= available) {
        updated[roomId] = count;
      }
      return updated;
    });
  };

  const totalCapacity = hotel ? Object.keys(selectedRooms).reduce((acc, roomId) => {
    const room = hotel.rooms.find(r => String(r.id) === String(roomId));
    return acc + (room ? room.capacity * selectedRooms[roomId] : 0);
  }, 0) : 0;

  useEffect(() => {
    if (totalCapacity > 0 && guestCount > totalCapacity) {
      setGuestCount(totalCapacity);
    }
  }, [totalCapacity, guestCount]);

  // Gọi API lấy thông tin homestay (Có hỗ trợ cập nhật số phòng trống theo ngày chọn)
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/homestays/${id}?checkIn=${checkIn}&checkOut=${checkOut}`);
        const data = response.data;


        setHotel(data);
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
            const data = response.data;


            setHotel(data);
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
    if (Object.keys(selectedRooms).length === 0) {
      await showAlert('Chưa chọn phòng', 'Vui lòng chọn ít nhất một loại phòng trước khi tiến hành đặt!', 'warning');
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
    
    let baseAmount = 0;
    Object.keys(selectedRooms).forEach(roomId => {
        const r = hotel.rooms.find(x => String(x.id) === String(roomId));
        if (r) {
            baseAmount += diffDays * r.price * selectedRooms[roomId];
        }
    });
    
    // Áp dụng giảm giá
    let discountRate = 0;
    if (guestCount >= 10 && guestCount <= 15) discountRate = 0.10;
    else if (guestCount > 15) discountRate = 0.15;
    
    const totalAmount = baseAmount * (1 - discountRate);

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
            rooms: Object.keys(selectedRooms).map(roomId => ({ roomTypeId: parseInt(roomId), count: selectedRooms[roomId] })),
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
            // Lấy tên các phòng đã chọn để hiển thị ngắn gọn
            const roomNames = Object.keys(selectedRooms)
              .map(roomId => hotel.rooms.find(r => String(r.id) === String(roomId))?.type)
              .filter(Boolean)
              .join(', ');
              
            // Chuyển hướng sang trang thanh toán kèm thông tin
            navigate(`/checkout/${res.data.bookingId}?amount=${res.data.depositAmount}&total=${totalAmount}&hotel=${hotel.name}&room=${roomNames}`);
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
    <>
      <Header />
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
                <div className={`room-card ${selectedRooms[room.id] > 0 ? 'selected' : ''}`} key={room.id} style={{ display: 'block', padding: '20px' }}>
                  <h3 style={{ marginBottom: '15px', fontSize: '1.25rem' }}>{room.type}</h3>
                  
                  {/* KHU VỰC ẢNH PHÒNG - MỤC ĐÍCH BẢO VỆ LUẬN VĂN: 
                      Bạn có thể tự thay đổi đường link ảnh (src) vào đây để đổi ảnh hiển thị */}
                  <div className="room-detail-images" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '10px' }}>
                      {room.image_url ? (
                        <>
                          <img src={room.image_url} alt={`${room.type} chính`} style={{ width: '250px', height: '160px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                          <div className="room-amenities-images">
                            {parseAmenitiesImages(room.amenities_images_text).map((imgUrl, idx) => (
                              <img key={idx} src={imgUrl} alt="Tiện nghi" style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                            ))}
                          </div>
                        </>
                      ) : (
                        getRoomImages(room.type).map((imgUrl, idx) => (
                          <img key={idx} src={imgUrl} alt={`${room.type} ${idx + 1}`} style={{ width: '200px', height: '140px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                        ))
                      )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="room-info" style={{ flex: 1, minWidth: '250px' }}>
                      <p><strong>Sức chứa:</strong> {room.adult_capacity} người lớn, {room.child_capacity} trẻ em (Tổng: {room.capacity} khách)</p>
                      <p style={{fontSize: '0.9rem', color: 'var(--primary-600)', marginTop: '4px'}}><strong>Tiện nghi:</strong> {room.room_amenities_text || 'Đầy đủ tiện nghi cơ bản'}</p>
                      {room.available > 0 ? (
                          <p style={{color: 'var(--status-confirmed)', fontWeight: 500, marginTop: '8px'}}>Còn trống {room.available} phòng</p>
                      ) : (
                          <p style={{color: 'var(--status-danger)', fontWeight: 500, marginTop: '8px'}}>Hiện tại đã hết phòng</p>
                      )}
                    </div>
                    <div className="room-action" style={{ textAlign: 'right' }}>
                      <div className="room-price" style={{ marginBottom: '10px' }}>
                        <strong style={{ fontSize: '1.2rem', color: '#ef4444' }}>{room.price.toLocaleString('vi-VN')} ₫</strong>/đêm
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-outline"
                          style={{ padding: '10px 20px', fontWeight: 600 }}
                          onClick={() => setViewRoomDetail(room)}
                        >
                          Xem chi tiết
                        </button>
                        
                        {/* Thay thế nút chọn bằng điều khiển tăng/giảm */}
                        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                          <button 
                            style={{ padding: '10px 15px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
                            onClick={() => handleRoomCountChange(room.id, (selectedRooms[room.id] || 0) - 1, room.available)}
                            disabled={!selectedRooms[room.id] || selectedRooms[room.id] <= 0}
                          >
                            -
                          </button>
                          <span style={{ padding: '0 15px', fontWeight: 600, minWidth: '30px', textAlign: 'center' }}>
                            {selectedRooms[room.id] || 0}
                          </span>
                          <button 
                            style={{ padding: '10px 15px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
                            onClick={() => handleRoomCountChange(room.id, (selectedRooms[room.id] || 0) + 1, room.available)}
                            disabled={(selectedRooms[room.id] || 0) >= room.available || room.available === 0}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
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
                <label>Số lượng khách {totalCapacity > 0 ? `(Tối đa: ${totalCapacity})` : ''}</label>
                <input 
                  type="number" 
                  min="1" 
                  max={totalCapacity > 0 ? totalCapacity : 50} 
                  value={guestCount} 
                  onChange={e => {
                    let val = parseInt(e.target.value) || 1;
                    if (totalCapacity > 0 && val > totalCapacity) {
                      val = totalCapacity;
                    }
                    setGuestCount(val);
                  }} 
                />
              </div>
              <div className="widget-summary">
                {Object.keys(selectedRooms).length > 0 ? (
                  Object.keys(selectedRooms).map(roomId => {
                    const r = hotel.rooms.find(x => String(x.id) === String(roomId));
                    return r ? (
                      <div className="summary-row" key={roomId}>
                        <span>{r.type}:</span>
                        <strong>{selectedRooms[roomId]} phòng</strong>
                      </div>
                    ) : null;
                  })
                ) : (
                  <div className="summary-row">
                    <span>Phòng đã chọn:</span>
                    <strong>Chưa có</strong>
                  </div>
                )}
                {guestCount >= 10 && guestCount <= 15 && (
                  <div className="summary-row total" style={{color: '#16a34a'}}>
                    <span>Giảm giá nhóm (10-15 người):</span>
                    <strong>-10%</strong>
                  </div>
                )}
                {guestCount > 15 && (
                  <div className="summary-row total" style={{color: '#16a34a'}}>
                    <span>Giảm giá nhóm (Trên 15 người):</span>
                    <strong>-15%</strong>
                  </div>
                )}
              </div>

              <button 
                className="btn btn-primary w-full cta-btn"
                onClick={handleBooking}
                disabled={isSubmitting || Object.keys(selectedRooms).length === 0}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Tiến hành Đặt phòng'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Room Detail Modal */}
      {viewRoomDetail && (
        <div className="room-detail-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setViewRoomDetail(null)}>
          <div className="room-detail-modal-content" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>{viewRoomDetail.type}</h2>
              <button onClick={() => setViewRoomDetail(null)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#64748b', padding: '0 10px' }}>&times;</button>
            </div>
            <div className="modal-images" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              {viewRoomDetail.image_url ? (
                <>
                  {/* Ảnh chính hiển thị 2 cột */}
                  <img src={viewRoomDetail.image_url} alt="Ảnh chính" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px', gridColumn: '1 / span 2' }} />
                  
                  {/* Các ảnh tiện nghi hiển thị ở dưới */}
                  {parseAmenitiesImages(viewRoomDetail.amenities_images_text).slice(0, 2).map((imgUrl, idx) => (
                    <img key={idx} src={imgUrl} alt="Tiện nghi" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                  ))}
                </>
              ) : (
                /* Nếu không có ảnh chính, lấy ảnh mặc định của phòng */
                getRoomImages(viewRoomDetail.type).slice(0, 3).map((imgUrl, idx) => (
                  <img key={idx} src={imgUrl} alt="Ảnh phòng" style={{ width: '100%', height: idx === 0 ? '300px' : '200px', objectFit: 'cover', borderRadius: '8px', gridColumn: idx === 0 ? '1 / span 2' : 'auto' }} />
                ))
              )}
            </div>
            <div className="modal-info">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#1e293b' }}>Thông tin phòng</h3>
                  <p style={{ fontSize: '1.05rem', marginBottom: '8px', color: '#475569' }}><strong>Sức chứa:</strong> {viewRoomDetail.adult_capacity} người lớn, {viewRoomDetail.child_capacity} trẻ em</p>
                  <p style={{ fontSize: '1.05rem', marginBottom: '8px', color: '#475569' }}><strong>Tổng khách tối đa:</strong> {viewRoomDetail.capacity} khách</p>
                  <p style={{ fontSize: '1.05rem', color: '#475569' }}><strong>Trạng thái:</strong> {viewRoomDetail.available > 0 ? <span style={{color: '#10b981', fontWeight: 600}}>Còn trống {viewRoomDetail.available} phòng</span> : <span style={{color: '#ef4444', fontWeight: 600}}>Hiện tại đã hết phòng</span>}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#1e293b' }}>Tiện nghi nổi bật</h3>
                  <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '1.05rem', lineHeight: '1.6' }}>
                    {viewRoomDetail.room_amenities_text ? viewRoomDetail.room_amenities_text.split(',').map((amenity, idx) => (
                      <li key={idx}>{amenity.trim()}</li>
                    )) : (
                      <>
                        <li>Ban công hướng đồi chè</li>
                        <li>Bồn tắm sứ cao cấp</li>
                        <li>Smart TV & Wifi tốc độ cao</li>
                        <li>Minibar miễn phí trà/cà phê</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              
              <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>Giá mỗi đêm</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>{viewRoomDetail.price.toLocaleString('vi-VN')} ₫</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <button 
                    style={{ padding: '12px 20px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '1.1rem' }}
                    onClick={() => handleRoomCountChange(viewRoomDetail.id, (selectedRooms[viewRoomDetail.id] || 0) - 1, viewRoomDetail.available)}
                    disabled={!selectedRooms[viewRoomDetail.id] || selectedRooms[viewRoomDetail.id] <= 0}
                  >
                    -
                  </button>
                  <span style={{ padding: '0 20px', fontWeight: 600, minWidth: '40px', textAlign: 'center', fontSize: '1.1rem' }}>
                    {selectedRooms[viewRoomDetail.id] || 0}
                  </span>
                  <button 
                    style={{ padding: '12px 20px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '1.1rem' }}
                    onClick={() => handleRoomCountChange(viewRoomDetail.id, (selectedRooms[viewRoomDetail.id] || 0) + 1, viewRoomDetail.available)}
                    disabled={(selectedRooms[viewRoomDetail.id] || 0) >= viewRoomDetail.available || viewRoomDetail.available === 0}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      <Footer />
    </>
  );
};

export default Detail;
