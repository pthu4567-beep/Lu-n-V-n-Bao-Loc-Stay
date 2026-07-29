import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, ChevronDown, User, History, LogOut, Menu, Bell, Key } from 'lucide-react';
import axios from 'axios';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('isLoggedIn') === 'true');
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);

  // Thông báo
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handleAvatarChanged = () => {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    handleAvatarChanged();

    window.addEventListener('avatarChanged', handleAvatarChanged);
    return () => {
      window.removeEventListener('avatarChanged', handleAvatarChanged);
    };
  }, [isLoggedIn]);

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
            setNotifications(res.data.data);
          }
        } catch (e) {
          console.log("Lỗi tải thông báo", e);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // 30s check 1 lần
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const markAsRead = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) { }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  return (
    <header className="fixed-header">
      <div className="header-container container">
        {/* Left: Logo & Nav */}
        <div className="header-left">
          <div className="logo-section" onClick={() => navigate('/')}>
            <img src="/baolocstay_premium_logo.png" alt="BaoLoc Stay Logo" className="logo-img" />
          </div>

          <nav className="main-nav">
            <a href="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Trang chủ</a>
            <a href="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>Khám phá Homestay</a>
            <a href="/promotions" className={`nav-link ${location.pathname === '/promotions' ? 'active' : ''}`}>Khuyến mãi</a>
            <a href="/#contact" className="nav-link">Liên hệ</a>
          </nav>
        </div>

        {/* Right: Auth */}
        <div className="auth-section">
          {!isLoggedIn ? (
            <div className="guest-auth">
              <button className="btn-text" onClick={() => navigate('/auth')}>Đăng nhập</button>
              <button className="btn-register" onClick={() => navigate('/auth?mode=register')}>Đăng ký</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* Notification Bell */}
              <div className="notification-bell" style={{ position: 'relative', cursor: 'pointer' }}>
                <div onClick={() => setShowNotif(!showNotif)}>
                  <Bell size={22} color="#475569" />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                {showNotif && (
                  <div className="dropdown-menu notif-menu" style={{ width: '320px', right: '-10px', padding: '12px', top: '150%', cursor: 'default' }}>
                    <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontSize: '15px' }}>Thông báo của bạn</h4>
                    {notifications.length === 0 ? <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>Chưa có thông báo nào</p> : (
                      <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {notifications.map(n => (
                          <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} style={{ padding: '10px', border: '1px solid #e2e8f0', background: n.is_read ? '#ffffff' : '#f0fdf4', cursor: n.is_read ? 'default' : 'pointer', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{n.title}</div>
                            <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>{n.message}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                              {(() => {
                                if (!n.created_at) return '';
                                const parts = n.created_at.replace('Z', '').split('T');
                                if (parts.length < 2) return n.created_at;
                                const dateP = parts[0].split('-');
                                const timeP = parts[1].split('.')[0];
                                return `${timeP} ${dateP[2]}/${dateP[1]}/${dateP[0]}`;
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
                <img src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : "https://i.pravatar.cc/150?img=32"} alt="Avatar" className="avatar" />
                <span className="username">{user ? (user.full_name || user.email.split('@')[0]) : 'Khách Hàng'}</span>
                <ChevronDown size={16} />

                {showDropdown && (
                  <div className="dropdown-menu">
                    {user && [1, 2, 4].includes(parseInt(user.roleId || user.role_id)) && (
                      <button className="dropdown-item text-primary" onClick={() => navigate('/admin')} style={{ fontWeight: 'bold' }}>
                        <User size={16} /> Trang quản lý
                      </button>
                    )}
                    <button className="dropdown-item" onClick={() => navigate('/profile', { state: { tab: 'profile' } })}><User size={16} /> Hồ sơ cá nhân</button>
                    <button className="dropdown-item" onClick={() => navigate('/profile', { state: { tab: 'history' } })}><History size={16} /> Lịch sử đặt phòng</button>
                    <button className="dropdown-item" onClick={() => navigate('/profile', { state: { tab: 'password' } })}><Key size={16} /> Đổi mật khẩu</button>
                    <button className="dropdown-item text-danger" onClick={handleLogout}><LogOut size={16} /> Đăng xuất</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <button className="mobile-menu-btn">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
