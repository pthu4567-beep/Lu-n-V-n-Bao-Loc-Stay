import React, { useState, useEffect } from 'react';
import { BedDouble, CheckCircle2, TrendingUp, TrendingDown, DollarSign, Clock, ArrowRight, Building, Award } from 'lucide-react';
import axios from 'axios';
import './DashboardStats.css';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    occupancyRate: 0,
    successRate: 0,
    currentRevenue: 0,
    growthPercent: 0,
    weekRevenue: 0,
    yearRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      try {
        const resStats = await axios.get('http://localhost:5000/api/admin/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resStats.data.success) {
          setStats(resStats.data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu tổng quan:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ padding: '1.5rem', textAlign: 'center' }}>Đang tải số liệu tổng quan...</div>;

  const { 
    occupancyRate, 
    successRate, 
    currentRevenue, 
    growthPercent, 
    weekRevenue, 
    yearRevenue,
    topHotel,
    topRoomType 
  } = stats;



  return (
    <div className="dashboard-overview-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="dashboard-stats-grid">
        {/* Tỷ lệ lấp đầy */}
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Tỷ lệ lấp đầy</h3>
            <div className="stat-icon-box occupancy">
              <BedDouble size={24} />
            </div>
          </div>
          <div className="stat-value">{occupancyRate}%</div>
        </div>

        {/* Tỷ lệ đơn thành công */}
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Đơn thành công</h3>
            <div className="stat-icon-box success">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="stat-value">{successRate}%</div>
        </div>

        {/* Doanh thu Tuần */}
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Doanh thu Tuần</h3>
            <div className="stat-icon-box revenue">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="stat-value">{(weekRevenue || 0).toLocaleString('vi-VN')} ₫</div>
          <div className="stat-badge-container">
            <span className="stat-compare">trong tuần này</span>
          </div>
        </div>

        {/* Doanh thu Tháng */}
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Doanh thu Tháng</h3>
            <div className="stat-icon-box revenue">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="stat-value">{currentRevenue.toLocaleString('vi-VN')} ₫</div>
          <div className="stat-badge-container">
            <span className={`stat-badge ${growthPercent >= 0 ? 'positive' : 'negative'}`}>
              {growthPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(growthPercent)}%
            </span>
            <span className="stat-compare">so với tháng trước</span>
          </div>
        </div>

        {/* Doanh thu Năm */}
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Doanh thu Năm</h3>
            <div className="stat-icon-box revenue">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="stat-value">{(yearRevenue || 0).toLocaleString('vi-VN')} ₫</div>
          <div className="stat-badge-container">
            <span className="stat-compare">trong năm nay</span>
          </div>
        </div>

        {/* Khách sạn nổi bật */}
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-header">
            <h3 className="stat-title">Khách sạn yêu thích nhất</h3>
            <div className="stat-icon-box success">
              <Building size={24} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {topHotel ? topHotel.name : 'Chưa có dữ liệu'}
          </div>
          <div className="stat-badge-container" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {topHotel && (
              <>
                <span className="stat-badge positive" style={{ fontSize: '0.85rem' }}>
                  <DollarSign size={14} />
                  {topHotel.totalRevenue.toLocaleString('vi-VN')} ₫
                </span>
                <span className="stat-compare" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={14} />
                  {topHotel.totalBookings} lượt đặt
                </span>
              </>
            )}
          </div>
          {topRoomType && (
             <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Award size={18} color="#f59e0b" />
               <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                 Phòng đặt nhiều nhất: <strong>{topRoomType.name}</strong> ({topRoomType.totalBookings} lượt)
               </span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
