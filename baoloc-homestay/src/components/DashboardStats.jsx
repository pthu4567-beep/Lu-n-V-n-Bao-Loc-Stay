import React, { useState, useEffect } from 'react';
import { BedDouble, CheckCircle2, TrendingUp, TrendingDown, DollarSign, Clock, ArrowRight } from 'lucide-react';
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

  const { occupancyRate, successRate, currentRevenue, growthPercent, weekRevenue, yearRevenue } = stats;



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
      </div>
    </div>
  );
};

export default DashboardStats;
