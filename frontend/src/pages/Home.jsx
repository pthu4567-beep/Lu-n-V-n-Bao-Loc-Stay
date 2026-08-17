import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Star, Heart, ChevronDown, Plus, Minus, Home as Gift, TreePine, Sun, Sparkles, Mountain, Coffee, Wifi, Car, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { mockHomestays } from '../data/homestays';
import { showToast } from '../utils/alert';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth state
  const [isLoggedIn] = useState(sessionStorage.getItem('isLoggedIn') === 'true');

  const [, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(storedUser));
    }
  }, [isLoggedIn]);

  // Thông báo



  useEffect(() => {
    if (isLoggedIn) {
      const fetchNotifs = async () => {
        try {
          const token = sessionStorage.getItem('token');
          if (!token) return;
          const res = await axios.get('http://localhost:5000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.success) {

          }
        } catch (e) {
          console.log("Lỗi tải thông báo", e);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);



  // Search form states
  const [searchTerm, setSearchTerm] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Guest Popover state
  const [showGuestPopover, setShowGuestPopover] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const popoverRef = useRef(null);

  useEffect(() => {
    // Close popover when clicking outside
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowGuestPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverRef]);

  useEffect(() => {
    const fetchHomestays = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/homestays');
        // Giữ toàn bộ dữ liệu để làm autocomplete
        setHomestays(response.data);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu homestay, sử dụng dữ liệu giả:', err);
        setHomestays(mockHomestays);
      } finally {
        setLoading(false);
      }
    };
    fetchHomestays();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const amenitiesCategories = [
    { id: 1, name: 'Săn mây', img: '/san-may.jpg' },
    { id: 2, name: 'Sân vườn BBQ', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
    { id: 3, name: 'Bồn tắm mộc', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
    { id: 4, name: 'View Đồi Chè', img: '/doi-che.jpg' }
  ];

  const seasonalDeals = [
    {
      id: 1,
      title: 'Khuyến mãi đặc biệt',
      description: 'Nhập mã GIAM10 tại bước Thanh toán để được giảm 10% cho toàn bộ Homestay!',
      discount: 'Giảm 10%',
      icon: <Sun size={28} />,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      period: 'Đến 31/12/2026'
    },
    {
      id: 2,
      title: 'Hè Rực Rỡ',
      description: 'Nhập mã MUAHE30 để nhận ưu đãi mùa hè siêu hấp dẫn lên đến 30%!',
      discount: 'Giảm 30%',
      icon: <TreePine size={28} />,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      period: 'Đến 31/08/2026'
    },
    {
      id: 3,
      title: 'Tết Nguyên Đán',
      description: 'Nhập mã TET20 để được giảm ngay 20% cho gia đình đặt phòng dịp Tết.',
      discount: 'Giảm 20%',
      icon: <Sparkles size={28} />,
      color: '#ef4444',
      bgColor: '#fee2e2',
      period: 'Đến 15/02/2027'
    },
    {
      id: 4,
      title: 'Flash Sale Cuối Tuần',
      description: 'Nhập mã TUAN15 – giảm 15% cho đặt phòng cuối tuần. Số lượng có hạn!',
      discount: 'Giảm 15%',
      icon: <Gift size={28} />,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      period: 'Đến 31/12/2026'
    }
  ];

  const balocHighlights = [
    { icon: <Mountain size={32} />, title: 'Độ cao 850m', desc: 'Khí hậu mát mẻ quanh năm, nhiệt độ trung bình 18–25°C' },
    { icon: <Coffee size={32} />, title: 'Thủ phủ Trà – Cà phê', desc: 'Nổi tiếng với đồi trà xanh bạt ngàn và cà phê Arabica thượng hạng' },
    { icon: <Wifi size={32} />, title: 'Homestay hiện đại', desc: 'Hệ thống lưu trú đa dạng từ bình dân đến cao cấp, đầy đủ tiện nghi' },
    { icon: <Car size={32} />, title: 'Di chuyển dễ dàng', desc: 'Cách TP.HCM chỉ 4 giờ lái xe, đường đi thuận tiện và cảnh đẹp' }
  ];

  return (
    <div className="home-page">
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-bg">
          <img src="/thanh-pho-bao-loc.jpg" alt="Bảo Lộc sương mây" />
        </div>
        <div className="hero-content container">
          <h1 className="hero-title">Khám phá chốn bình yên giữa lòng Bảo Lộc</h1>
          <p className="hero-subtitle">Tìm kiếm không gian nghỉ dưỡng hoàn hảo giữa chốn sương mây</p>

          <form className={`search-box glass-panel ${isSticky ? 'sticky-search' : ''}`} onSubmit={handleSearch}>
            <div className="search-item flex-2">
              <label>Địa điểm / Tên</label>
              <input
                type="text"
                placeholder="VD: Bảo Lộc Stay, Lộc Phát..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                list="homestay-suggestions"
                autoComplete="off"
              />
              <datalist id="homestay-suggestions">
                {/* Đề xuất tên Homestay */}
                {homestays.map(home => (
                  <option key={`name-${home.id}`} value={home.name}></option>
                ))}
                {/* Đề xuất Địa chỉ duy nhất */}
                {[...new Set(homestays.map(h => h.address).filter(Boolean))].map((address, idx) => (
                  <option key={`addr-${idx}`} value={address}></option>
                ))}
              </datalist>
            </div>

            <div className="search-divider"></div>

            <div className="search-item flex-1">
              <label>Ngày Check-in</label>
              <input 
                type="date" 
                value={checkIn} 
                onChange={e => setCheckIn(e.target.value)} 
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="search-divider"></div>

            <div className="search-item flex-1">
              <label>Ngày Check-out</label>
              <input 
                type="date" 
                value={checkOut} 
                onChange={e => setCheckOut(e.target.value)} 
                min={checkIn || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="search-divider"></div>

            <div className="search-item flex-1 position-relative" ref={popoverRef}>
              <label>Số lượng khách</label>
              <div className="guest-selector" onClick={() => setShowGuestPopover(!showGuestPopover)}>
                <span>{adults + children} khách</span>
                <ChevronDown size={16} />
              </div>

              {showGuestPopover && (
                <div className="guest-popover">
                  <div className="guest-row">
                    <div className="guest-label">
                      <strong>Người lớn</strong>
                      <span>Từ 13 tuổi trở lên</span>
                    </div>
                    <div className="guest-controls">
                      <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))}><Minus size={16} /></button>
                      <span>{adults}</span>
                      <button type="button" onClick={() => setAdults(adults + 1)}><Plus size={16} /></button>
                    </div>
                  </div>
                  <div className="guest-row">
                    <div className="guest-label">
                      <strong>Trẻ em</strong>
                      <span>Dưới 13 tuổi</span>
                    </div>
                    <div className="guest-controls">
                      <button type="button" onClick={() => setChildren(Math.max(0, children - 1))}><Minus size={16} /></button>
                      <span>{children}</span>
                      <button type="button" onClick={() => setChildren(children + 1)}><Plus size={16} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn-search-main">
              <Search size={24} />
            </button>
          </form>
        </div>
      </section>

      {/* About Bảo Lộc Section */}
      <section className="about-baoloc-section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h2>Bảo Lộc – Thiên đường nghỉ dưỡng giữa Tây Nguyên</h2>
            <p>Nơi sương mây quyện hòa cùng đồi trà xanh bạt ngàn</p>
          </div>
          <div className="about-content">
            <div className="about-text">
              <p>
                Bảo Lộc là thành phố xinh đẹp thuộc tỉnh Lâm Đồng, nằm trên cao nguyên Di Linh ở độ cao 850m so với mực nước biển.
                Nơi đây được thiên nhiên ưu ái ban tặng khí hậu mát lành quanh năm, cùng cảnh quan hùng vĩ với những cánh rừng thông,
                thác nước hoang sơ, và đặc biệt là những đồi trà xanh trải dài tít tắp đến tận chân trời.
              </p>
              <p>
                Không ồn ào náo nhiệt như Đà Lạt, Bảo Lộc mang đến một nhịp sống chậm rãi, bình yên –
                nơi bạn có thể thưởng trà sớm mai giữa biển mây, ngắm hoàng hôn trên đồi,
                hay đơn giản là tận hưởng không khí trong lành trong căn homestay ấm cúng.
              </p>
            </div>
            <div className="about-highlights">
              {balocHighlights.map((item, idx) => (
                <div className="highlight-item" key={idx}>
                  <div className="highlight-icon">{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seasonal Deals Section */}
      <section className="deals-section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-badge"><Gift size={16} /> Ưu đãi đặc biệt</div>
            <h2>Chương trình khuyến mãi theo mùa</h2>
            <p>Đặt phòng đúng dịp – nhận ngay deal cực sốc từ các Homestay tại Bảo Lộc</p>
          </div>
          <div className="deals-grid">
            {seasonalDeals.map(deal => (
              <div className="deal-card" key={deal.id} style={{ '--deal-color': deal.color, '--deal-bg': deal.bgColor }}>
                <div className="deal-discount">{deal.discount}</div>
                <h3>{deal.title}</h3>
                <p>{deal.description}</p>
                <div className="deal-period">
                  <Calendar size={14} /> {deal.period}
                </div>
                <button className="btn btn-outline deal-btn" onClick={() => navigate('/search')}>
                  Đặt ngay <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Homestays */}
      <section className="featured-section container">
        <div className="section-header">
          <h2>Gợi ý hàng đầu cho bạn</h2>
          <p>Các địa điểm được yêu thích nhất tháng này</p>
        </div>

        {loading ? (
          <div className="loading-state">Đang tải dữ liệu...</div>
        ) : (
          <div className="homestay-grid">
            {homestays.slice(0, 8).map(home => (
              <div className="homestay-card" key={home.id} onClick={() => navigate(`/homestay/${home.id}`)}>
                <div className="card-img-wrapper">
                  <img src={home.img} alt={home.name} />
                  <div className="favorite-badge">
                    <Heart size={16} fill="currentColor" /> Yêu thích
                  </div>
                </div>
                <div className="card-info">
                  <h3>{home.name}</h3>
                  <div className="rating-row">
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    <span className="rating-score">{home.rating}</span>
                    <span className="review-count">({home.review_count || 0} đánh giá)</span>
                  </div>
                  <p className="card-address"><MapPin size={14} /> {home.address}</p>
                  <p className="card-desc">{home.description || 'Homestay xinh đẹp với không gian thoáng đãng, view đồi trà xanh mướt, gần trung tâm thành phố Bảo Lộc.'}</p>
                  <div className="card-amenities">
                    {(Array.isArray(home.amenities)
                      ? home.amenities
                      : (home.facilities_text || '').split(',').filter(x => x.trim())
                    ).slice(0, 3).map((item, idx) => (
                      <span key={idx} className="amenity-tag">
                        <Sparkles size={12} /> {item.trim()}
                      </span>
                    ))}
                  </div>
                  <div className="card-price">
                    <div className="price-left">
                      <span>Từ</span>
                      <strong>{home.price.toLocaleString('vi-VN')}đ</strong>
                      <span className="per-night">/đêm</span>
                    </div>
                    <button className="btn-book-now">Xem phòng</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Experiences Section */}
      <section className="experiences-section container">
        <div className="section-header">
          <h2>Trải nghiệm theo phong cách</h2>
          <p>Khám phá Bảo Lộc theo cách riêng của bạn</p>
        </div>
        <div className="experiences-grid">
          {amenitiesCategories.map(cat => (
            <div key={cat.id} className="experience-block" onClick={() => navigate(`/search?q=${encodeURIComponent(cat.name)}`)}>
              <img src={cat.img} alt={cat.name} />
              <div className="experience-overlay"></div>
              <h3>{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-wrapper">
        <div className="container contact-content">
          <div className="contact-text">
            <h2>Bạn cần tư vấn thêm? Hãy để lại lời nhắn!</h2>
            <p>Đội ngũ hỗ trợ của BaoLoc Stay luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
          </div>
          <form className="contact-form glass-panel" onSubmit={async (e) => {
            e.preventDefault();
            try {
              const formData = new FormData(e.target);
              await axios.post('http://localhost:5000/api/contact', {
                ho_lot: formData.get('ho_lot'),
                ten: formData.get('ten'),
                email: formData.get('email'),
                loi_nhan: formData.get('loi_nhan')
              });
              showToast('Đã gửi lời nhắn thành công!', 'success');
              e.target.reset();
            } catch (err) {
              console.error("Lỗi gửi liên hệ:", err);
              showToast('Có lỗi xảy ra khi gửi lời nhắn.', 'error');
            }
          }}>
            <div className="form-row">
              <input type="text" name="ho_lot" placeholder="Họ lót" required />
              <input type="text" name="ten" placeholder="Tên" required />
            </div>
            <input type="email" name="email" placeholder="Email của bạn" required />
            <textarea name="loi_nhan" placeholder="Lời nhắn của bạn..." rows="4" required></textarea>
            <button type="submit" className="btn btn-primary w-full">Gửi lời nhắn</button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
