import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft, CheckCircle2, Home as HomeIcon, MapPin, User, Phone, Mail, Calendar, Clock } from 'lucide-react';
import './Invoice.css';

const Invoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      const res = await axios.get(`http://localhost:5000/api/bookings/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setInvoice(res.data.invoice);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu hóa đơn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="invoice-loading">Đang tải hóa đơn...</div>;
  if (error) return <div className="invoice-error">{error}</div>;
  if (!invoice) return <div className="invoice-error">Không tìm thấy hóa đơn.</div>;

  return (
    <div className="invoice-page-container">
      <div className="invoice-actions no-print">
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          <HomeIcon size={16} /> Về trang chủ
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/profile')}>
          <ArrowLeft size={16} /> Quay lại Hồ sơ
        </button>
        <button className="btn btn-primary print-btn" onClick={handlePrint}>
          <Printer size={16} /> In hóa đơn
        </button>
      </div>

      <div className="invoice-card">
        <div className="invoice-header">
          <div className="invoice-logo">
            <HomeIcon size={32} color="#0ea5e9" />
            <span>Bảo Lộc Stay</span>
          </div>
          <div className="invoice-title">
            <h1>HÓA ĐƠN / BIÊN NHẬN</h1>
            <p>Mã đơn: <strong>#{invoice.booking_id}</strong></p>
            <p>Ngày tạo: {new Date(invoice.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        <div className="invoice-status">
          <CheckCircle2 size={24} color="#10b981" />
          <span>{invoice.booking_status === 'pending_payment' ? 'Chưa thanh toán' : 'Đã ghi nhận thanh toán/đặt cọc'}</span>
        </div>

        <div className="invoice-body">
          <div className="invoice-row">
            <div className="invoice-section">
              <h3>Thông tin Khách hàng</h3>
              <p><User size={14} /> <strong>{invoice.guest_name}</strong></p>
              <p><Phone size={14} /> {invoice.guest_phone || 'Chưa cập nhật'}</p>
              <p><Mail size={14} /> {invoice.guest_email}</p>
            </div>
            
            <div className="invoice-section">
              <h3>Thông tin Chủ Homestay (Liên hệ)</h3>
              <p><User size={14} /> <strong>{invoice.owner_name}</strong></p>
              <p><Phone size={14} /> {invoice.owner_phone || 'Chưa cập nhật'}</p>
              <p><Mail size={14} /> {invoice.owner_email}</p>
            </div>
          </div>

          <div className="invoice-section mt-4">
            <h3>Chi tiết Lưu trú</h3>
            <div className="stay-details">
              <div className="detail-item">
                <span className="detail-label"><HomeIcon size={14} /> Homestay</span>
                <span className="detail-value"><strong>{invoice.homestay_name}</strong></span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><MapPin size={14} /> Địa chỉ</span>
                <span className="detail-value">{invoice.homestay_address}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><HomeIcon size={14} /> Loại phòng</span>
                <span className="detail-value">{invoice.room_type}</span>
              </div>
            </div>
          </div>

          <div className="invoice-row mt-4">
            <div className="invoice-section date-box">
              <h3><Calendar size={16} /> Nhận phòng (Check-in)</h3>
              <p className="date-time">
                {invoice.check_in_datetime ? new Date(invoice.check_in_datetime).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
              </p>
              <p className="time"><Clock size={14} /> 14:00</p>
            </div>
            
            <div className="invoice-section date-box">
              <h3><Calendar size={16} /> Trả phòng (Check-out)</h3>
              <p className="date-time">
                {invoice.check_out_datetime ? new Date(invoice.check_out_datetime).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
              </p>
              <p className="time"><Clock size={14} /> 12:00</p>
            </div>
          </div>

          <div className="invoice-summary mt-4">
            <div className="summary-row grand-total">
              <span>Tổng thanh toán</span>
              <span>{invoice.total_amount?.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

        </div>
        
        <div className="invoice-footer">
          <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
          <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ trực tiếp với chủ Homestay theo số điện thoại trên.</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
