import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Star, Filter } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import './Search.css';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [priceRange, setPriceRange] = useState(2000000);
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu theo query URL
  useEffect(() => {
    const fetchSearch = async () => {
      setLoading(true);
      try {
        const url = initialQuery ? `http://localhost:5000/api/homestays?search=${encodeURIComponent(initialQuery)}` : `http://localhost:5000/api/homestays`;
        const response = await axios.get(url);
        setHomestays(response.data);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu search:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSearch();
  }, [initialQuery]);

  // Lọc theo giá ở frontend (hoặc có thể đưa lên backend)
  const filteredHomestays = homestays.filter(h => h.price <= priceRange);

  return (
    <>
      <Header />
      <div className="search-page container">
        <div className="search-header">
          <h1>Kết quả tìm kiếm {initialQuery && `cho "${initialQuery}"`}</h1>
          <p>Tìm thấy {filteredHomestays.length} homestay tại Bảo Lộc</p>
        </div>

        <div className="search-layout">
          {/* Sidebar Filter */}
          <aside className="sidebar">
            <div className="filter-block">
              <h3><Filter size={18} /> Hình thức thuê</h3>
              <div className="radio-group">
                <label className="custom-radio">
                  <input type="radio" name="rentType" defaultChecked />
                  <span className="radio-mark"></span>
                  Tất cả
                </label>
                <label className="custom-radio">
                  <input type="radio" name="rentType" />
                  <span className="radio-mark"></span>
                  Thuê theo ngày
                </label>
                <label className="custom-radio">
                  <input type="radio" name="rentType" />
                  <span className="radio-mark"></span>
                  Thuê theo giờ
                </label>
              </div>
            </div>

            <div className="filter-block">
              <h3>Mức giá tối đa</h3>
              <div className="price-slider">
                <input
                  type="range"
                  min="200000"
                  max="5000000"
                  step="100000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
                <div className="price-display">
                  {parseInt(priceRange).toLocaleString('vi-VN')} ₫
                </div>
              </div>
            </div>

            <div className="filter-block">
              <h3>Tiện ích phổ biến</h3>
              <div className="checkbox-group">
                <label className="custom-checkbox">
                  <input type="checkbox" onChange={() => navigate('/search?q=Sân BBQ')} />
                  <span className="checkmark"></span>
                  Sân BBQ
                </label>
                <label className="custom-checkbox">
                  <input type="checkbox" onChange={() => navigate('/search?q=săn mây')} />
                  <span className="checkmark"></span>
                  Săn mây
                </label>
                <label className="custom-checkbox">
                  <input type="checkbox" onChange={() => navigate('/search?q=Bồn tắm')} />
                  <span className="checkmark"></span>
                  Bồn tắm gỗ
                </label>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="results">
            <div className="results-toolbar">
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Sắp xếp theo:</span>
              <select className="sort-select">
                <option>Đề xuất cho bạn</option>
                <option>Giá tăng dần</option>
                <option>Giá giảm dần</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải kết quả...</div>
            ) : (
              /* Main Content */
              <div className="main-content">
                <div className="list-grid">
                  {filteredHomestays.map(home => (
                    <div className="list-card" key={home.id} onClick={() => navigate(`/homestay/${home.id}`)}>
                      <div className="list-img">
                        <img src={home.img} alt={home.name} />
                        <div className="favorite-badge">
                          <Star size={16} fill="currentColor" /> Yêu thích
                        </div>
                      </div>
                      <div className="list-info">
                        <div className="list-header">
                          <h2>{home.name}</h2>
                          <div className="card-rating">
                            <Star size={14} fill="currentColor" /> {home.rating}
                          </div>
                        </div>
                        <p className="card-address"><MapPin size={14} /> {home.address}</p>
                        <p className="card-desc" style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{home.description || 'Chỗ nghỉ tuyệt vời cho chuyến du lịch Bảo Lộc của bạn. Đầy đủ tiện nghi và gần các điểm tham quan.'}</p>

                        <div className="list-tags">
                          <span>WiFi miễn phí</span>
                          <span>Chỗ để xe</span>
                          <span>Bếp</span>
                        </div>

                        <div className="list-footer">
                          <div className="card-price">
                            <span>Từ </span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                              <strong>{home.price.toLocaleString('vi-VN')} ₫</strong>
                              <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '500', textTransform: 'none' }}>/đêm</span>
                            </div>
                          </div>
                          <button className="btn btn-primary">Xem phòng</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredHomestays.length === 0 && (
                    <div className="no-results">
                      <h3>Không tìm thấy homestay phù hợp</h3>
                      <p>Thử điều chỉnh lại mức giá hoặc từ khóa tìm kiếm nhé!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Search;
