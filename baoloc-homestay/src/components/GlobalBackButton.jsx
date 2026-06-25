import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './GlobalBackButton.css';

const GlobalBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Không hiển thị nút Back ở trang chủ, admin, owner, và auth
  if (
    location.pathname === '/' || 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/owner') ||
    location.pathname.startsWith('/auth')
  ) {
    return null;
  }

  return (
    <button 
      className="global-back-btn" 
      onClick={() => navigate(-1)}
      title="Quay lại trang trước"
    >
      <ArrowLeft size={24} color="#1e293b" />
    </button>
  );
};

export default GlobalBackButton;
