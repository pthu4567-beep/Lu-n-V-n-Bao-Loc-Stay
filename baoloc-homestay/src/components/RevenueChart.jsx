import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { showToast } from '../utils/alert';
import './RevenueChart.css';

const formatCurrency = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const RevenueChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('year'); // 'week' hoặc 'year'

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      try {
        const res = await axios.get(`http://localhost:5000/api/admin/dashboard/revenue-chart?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        showToast('Lỗi khi tải biểu đồ doanh thu', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [type]);

  return (
    <div className="revenue-chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="revenue-chart-title">Tổng quan Doanh thu</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setType('week')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: type === 'week' ? '#eff6ff' : '#fff',
              color: type === 'week' ? '#2563eb' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Tuần này
          </button>
          <button 
            onClick={() => setType('year')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: type === 'year' ? '#eff6ff' : '#fff',
              color: type === 'year' ? '#2563eb' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Năm nay
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="revenue-chart-loading">Đang tải dữ liệu...</div>
      ) : (
        <div className="revenue-chart-wrapper">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
