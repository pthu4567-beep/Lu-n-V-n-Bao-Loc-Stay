import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, ChevronDown, User, History, LogOut, Menu } from 'lucide-react';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('isLoggedIn') === 'true');
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [isLoggedIn]);

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
        {/* Left: Logo */}
        <div className="logo-section" onClick={() => navigate('/')}>
          <HomeIcon className="logo-icon" size={28} />
          <span className="logo-text">BaoLoc Stay</span>
        </div>

        {/* Center: Navigation */}
        <nav className="main-nav">
          <a href="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Trang chủ</a>
          <a href="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>Khám phá Homestay</a>
          <a href="/#promotions" className="nav-link">Khuyến mãi</a>
          <a href="/#contact" className="nav-link">Liên hệ</a>
        </nav>

        {/* Right: Auth */}
        <div className="auth-section">
          {!isLoggedIn ? (
            <div className="guest-auth">
              <button className="btn-text" onClick={() => navigate('/auth')}>Đăng nhập</button>
              <button className="btn-register" onClick={() => navigate('/auth?mode=register')}>Đăng ký</button>
            </div>
          ) : (
            <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
              <img src="https://i.pravatar.cc/150?img=32" alt="Avatar" className="avatar" />
              <span className="username">{user ? user.email.split('@')[0] : 'Khách Hàng'}</span>
              <ChevronDown size={16} />

              {showDropdown && (
                <div className="dropdown-menu">
                  {user && (user.roleId === 1 || user.roleId === 2) && (
                    <button className="dropdown-item text-primary" onClick={() => navigate('/admin')} style={{ fontWeight: 'bold' }}>
                      <User size={16} /> Trang quản lý
                    </button>
                  )}
                  <button className="dropdown-item" onClick={() => navigate('/profile')}><User size={16} /> Hồ sơ cá nhân</button>
                  <button className="dropdown-item" onClick={() => navigate('/profile')}><History size={16} /> Lịch sử đặt phòng</button>
                  <button className="dropdown-item text-danger" onClick={handleLogout}><LogOut size={16} /> Đăng xuất</button>
                </div>
              )}
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
