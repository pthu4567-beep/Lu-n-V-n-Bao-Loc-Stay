/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MessageSquare, CheckCircle, Mail, Phone, Calendar, DollarSign, Home as HomeIcon, MapPin, Grid, Layers, Users, Star, LogOut, PieChart, Check, RefreshCw, ArrowRight, Eye, Plus, Edit, Trash2, CheckCircle2, XCircle, MessageCircle, X, Building, Award } from 'lucide-react';
import axios from 'axios';
import { showAlert, showToast, showConfirm } from '../utils/alert';
import DashboardStats from '../components/DashboardStats';
import RevenueChart from '../components/RevenueChart';
import RecentTransactions from '../components/RecentTransactions';
import './AdminDashboard.css';

// Helpers để hiển thị giờ chuẩn do CSDL trả về Local Time dưới dạng UTC string
const formatLocalDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} ${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
};

const formatLocalDateOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
};

const getWeekNumber = (dateString) => {
  if (!dateString) return 0;
  const d = new Date(dateString);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [payments, setPayments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [homestays, setHomestays] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [promotionsList, setPromotionsList] = useState([]);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Thêm mới States
  const [showHomestayModal, setShowHomestayModal] = useState(false);
  const [newHomestay, setNewHomestay] = useState({ name: '', description: '', facilities_text: '', address: '', status: 'active', images_text: '' });

  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [newRoomType, setNewRoomType] = useState({ hotel_id: '', name: '', base_price: '', capacity: '', room_amenities_text: '' });

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ room_type_id: '', room_number: '', status: 'available' });

  const [showEditHomestayModal, setShowEditHomestayModal] = useState(false);
  const [editingHomestay, setEditingHomestay] = useState(null);

  const [showEditRoomTypeModal, setShowEditRoomTypeModal] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);

  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newPromo, setNewPromo] = useState({ hotel_id: '', discount_code: '', discount_percent: '', valid_until: '' });

  const [showEditPromoModal, setShowEditPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInBookingId, setCheckInBookingId] = useState(null);
  const [checkInCCCD, setCheckInCCCD] = useState('');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalData, setRoleModalData] = useState({ userId: null, newRole: 3, hotelId: '' });


  // Filter States
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterReview, setFilterReview] = useState('all');
  const [filterContact, setFilterContact] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [revenueFilterYear, setRevenueFilterYear] = useState(new Date().getUTCFullYear().toString());
  const [revenueFilterMonth, setRevenueFilterMonth] = useState('all');
  const [revenueFilterWeek, setRevenueFilterWeek] = useState('all');
  const [revenueFilterHomestay, setRevenueFilterHomestay] = useState('all');

  // Search States
  const [searchPayment, setSearchPayment] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchReview, setSearchReview] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [searchHomestay, setSearchHomestay] = useState('');
  const [searchRoomType, setSearchRoomType] = useState('');
  const [searchRoom, setSearchRoom] = useState('');

  // Kiểm tra quyền Admin
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    const roleId = parseInt(parsedUser.roleId);
    if (![1, 2, 4].includes(roleId)) {
      showAlert('Từ chối truy cập', 'Bạn không có quyền truy cập trang quản trị!', 'warning').then(() => {
        navigate('/');
      });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(parsedUser);
    if (parsedUser.roleId === 2 || parsedUser.roleId === 1) {
      setActiveTab('overview');
    }
  }, [navigate]);

  // Load dữ liệu dựa theo tab hoạt động
  useEffect(() => {
    if (!user) return;

    const token = sessionStorage.getItem('token');
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'payments' || activeTab === 'revenue') {
          const res = await axios.get('http://localhost:5000/api/admin/orders/bookings', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPayments(res.data.data || res.data || []);
        } else if (activeTab === 'contacts') {
          const res = await axios.get('http://localhost:5000/api/admin/system/contacts', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setContacts(res.data.data || res.data || []);
        } else if (activeTab === 'homestays') {
          const res = await axios.get('http://localhost:5000/api/admin/catalog/hotels', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setHomestays(res.data.data || res.data || []);
        } else if (activeTab === 'roomTypes') {
          const res = await axios.get('http://localhost:5000/api/admin/catalog/room-types', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRoomTypes(res.data.data || []);
        } else if (activeTab === 'rooms') {
          const res = await axios.get('http://localhost:5000/api/admin/catalog/rooms', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRooms(res.data.data || []);
        } else if (activeTab === 'users' && user.roleId === 1) {
          const res = await axios.get('http://localhost:5000/api/admin/system/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUsersList(res.data.data || []);
        } else if (activeTab === 'reviews' && (user.roleId === 1 || user.roleId === 2)) {
          const res = await axios.get('http://localhost:5000/api/admin/system/reviews', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setReviewsList(res.data.data || []);
        } else if (activeTab === 'promotions') {
          const res = await axios.get('http://localhost:5000/api/admin/catalog/promotions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPromotionsList(res.data.data || []);
          
          if (homestays.length === 0) {
            const hRes = await axios.get('http://localhost:5000/api/admin/catalog/hotels', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setHomestays(hRes.data.data || hRes.data || []);
          }
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, user]);

  // Duyệt thanh toán
  const handleVerifyPayment = async (bookingId) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const confirmResult = await showConfirm('Duyệt thanh toán', `Bạn có chắc chắn muốn duyệt thanh toán đơn hàng #${bookingId}?`);
    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      const res = await axios.put(`http://localhost:5000/api/admin/orders/payments/${bookingId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        // Refresh danh sách
        setPayments(payments.map(p => (p.bookingId || p.id) === bookingId ? { ...p, status: 'confirmed', payment_status: 'paid' } : p));
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi duyệt thanh toán', 'error');
    }
  };

  // Thu tiền phần còn lại
  const handlePayRemaining = async (bookingId) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const confirmResult = await showConfirm('Thu tiền', `Xác nhận đã thu đủ số tiền còn lại cho đơn hàng #${bookingId}?`);
    if (!confirmResult.isConfirmed) return;

    try {
      const res = await axios.put(`http://localhost:5000/api/admin/orders/bookings/${bookingId}/pay-remaining`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Thu tiền thành công!", 'success');
        setPayments(payments.map(p => (p.bookingId || p.id) === bookingId ? { ...p, remaining_amount: 0, payment_status: 'paid', status: (p.status === 'deposited' ? 'confirmed' : p.status) } : p));
        setSelectedOrder(null);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi thu tiền', 'error');
    }
  };

  // Duyệt hoàn tiền
  const handleApproveRefund = async (order) => {
    const bookingId = order.bookingId || order.id;
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const amount = order?.refund_amount || 0;
    const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const confirmResult = await showConfirm('Duyệt hoàn tiền', `Bạn chắc chắn muốn duyệt hoàn tiền ${formattedAmount} cho đơn hàng #${bookingId}?`);
    if (!confirmResult.isConfirmed) return;

    try {
      const res = await axios.put(`http://localhost:5000/api/admin/orders/bookings/${bookingId}/approve-refund`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setPayments(payments.map(p => (p.bookingId || p.id) === bookingId ? { ...p, status: 'completed' } : p));
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi duyệt hoàn tiền', 'error');
    }
  };

  // Check-in (Nhận phòng)
  const handleCheckIn = (bookingId) => {
    setCheckInBookingId(bookingId);
    setCheckInCCCD('');
    setShowCheckInModal(true);
  };

  const confirmCheckIn = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    if (!checkInCCCD.trim()) {
      showToast('Vui lòng nhập số Căn cước công dân để nhận phòng!', 'error');
      return;
    }

    try {
      const res = await axios.put(`http://localhost:5000/api/admin/orders/bookings/${checkInBookingId}/checkin`, { cccd: checkInCCCD }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setPayments(payments.map(p => (p.bookingId || p.id) === checkInBookingId ? { ...p, status: 'checked_in', guest_cccd: checkInCCCD } : p));
        setShowCheckInModal(false);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi xác nhận nhận phòng', 'error');
    }
  };

  // Trả phòng
  const handleCheckOut = async (bookingId) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const confirmResult = await showConfirm('Trả phòng', `Xác nhận khách đã trả phòng cho đơn hàng #${bookingId}?`);
    if (!confirmResult.isConfirmed) return;

    try {
      const res = await axios.put(`http://localhost:5000/api/admin/orders/bookings/${bookingId}/status`, { status: 'completed' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Trả phòng thành công!", 'success');
        setPayments(payments.map(p => (p.bookingId || p.id) === bookingId ? { ...p, status: 'completed' } : p));
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi xác nhận trả phòng', 'error');
    }
  };

  // Xóa đơn hàng
  const handleDeleteOrder = async (bookingId) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const confirmResult = await showConfirm('Xóa đơn hàng', `BẠN CÓ CHẮC CHẮN XÓA ĐƠN HÀNG #${bookingId}? Việc này sẽ xóa mọi dữ liệu liên quan và không thể hoàn tác!`);
    if (!confirmResult.isConfirmed) return;

    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/orders/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Xóa đơn hàng thành công!", 'success');
        setPayments(payments.filter(p => (p.bookingId || p.id) !== bookingId));
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi xóa đơn hàng', 'error');
    }
  };

  // Trả lời tin nhắn
  const handleReplyContact = async (contactId) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.put(`http://localhost:5000/api/admin/system/contacts/${contactId}/reply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        // Refresh danh sách
        setContacts(contacts.map(c => c.id === contactId ? { ...c, status: 'replied' } : c));
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi cập nhật liên hệ', 'error');
    }
  };

  // --- USERS MANAGEMENT ---
  const handleUpdateRole = (id, currentRoleId) => {
    setRoleModalData({ userId: id, newRole: currentRoleId || 3, hotelId: '' });
    setShowRoleModal(true);
  };

  const submitUpdateRole = async () => {
    const { userId, newRole, hotelId } = roleModalData;
    const token = sessionStorage.getItem('token');
    if (!newRole || ![1, 2, 3, 4].includes(parseInt(newRole))) {
      showToast("Vui lòng chọn quyền hợp lệ!", "error");
      return;
    }

    let parsedHotelId = null;
    if (parseInt(newRole) === 4) {
      parsedHotelId = parseInt(hotelId);
      if (!parsedHotelId) {
        showToast("Vui lòng nhập ID Khách sạn!", "error");
        return;
      }
    }

    try {
      const res = await axios.put(`http://localhost:5000/api/admin/system/users/${userId}/role`, { role_id: parseInt(newRole), hotel_id: parsedHotelId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Cập nhật thành công!", 'success');
        setUsersList(usersList.map(u => u.id === userId ? { ...u, role_id: parseInt(newRole), hotel_id: parsedHotelId } : u));
        setShowRoleModal(false);
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi cập nhật quyền", 'error');
    }
  };

  const handleBlockUser = async (id, isBlocked) => {
    const token = sessionStorage.getItem('token');
    const confirmResult = await showConfirm('Xác nhận', `Bạn có chắc muốn ${isBlocked ? 'mở khóa' : 'khóa'} người dùng này?`);
    if (!confirmResult.isConfirmed) return;

    try {
      const res = await axios.put(`http://localhost:5000/api/admin/system/users/${id}/block`, { is_blocked: !isBlocked }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Cập nhật thành công!", 'success');
        setUsersList(usersList.map(u => u.id === id ? { ...u, is_blocked: !isBlocked } : u));
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi cập nhật trạng thái", 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    const token = sessionStorage.getItem('token');
    const confirmResult = await showConfirm('Cảnh báo', "BẠN CÓ CHẮC CHẮN XÓA TÀI KHOẢN NÀY? Không thể hoàn tác!");
    if (!confirmResult.isConfirmed) return;

    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/system/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Xóa thành công!", 'success');
        setUsersList(usersList.filter(u => u.id !== id));
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi xóa tài khoản", 'error');
    }
  };

  // --- REVIEWS MANAGEMENT ---
  const handleUpdateReviewStatus = async (id, newStatus) => {
    const token = sessionStorage.getItem('token');
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/system/reviews/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Cập nhật thành công!", 'success');
        setReviewsList(reviewsList.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi cập nhật trạng thái", 'error');
    }
  };

  const submitReplyReview = async () => {
    const token = sessionStorage.getItem('token');
    if (!replyText || replyText.trim() === '') {
      showToast("Vui lòng nhập nội dung!", 'warning');
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/admin/system/reviews/${replyingReviewId}/reply`, { reply_comment: replyText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Phản hồi thành công!", 'success');
        setReviewsList(reviewsList.map(r => r.id === replyingReviewId ? { ...r, reply_comment: replyText } : r));
        setReplyingReviewId(null);
        setReplyText('');
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi phản hồi đánh giá", 'error');
    }
  };

  const handleDeleteReview = async (id) => {
    const token = sessionStorage.getItem('token');
    const confirmResult = await showConfirm('Cảnh báo', "Bạn có chắc muốn xóa đánh giá này?");
    if (!confirmResult.isConfirmed) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/system/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast("Xóa thành công!", 'success');
        setReviewsList(reviewsList.filter(r => r.id !== id));
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi xóa đánh giá", 'error');
    }
  };

  // --- ADD NEW DATA HANDLERS ---
  const submitHomestay = async () => {
    const token = sessionStorage.getItem('token');
    if (!newHomestay.name || !newHomestay.address) {
      showToast('Vui lòng nhập tên và địa chỉ!', 'warning');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/admin/catalog/hotels', newHomestay, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('Thêm Homestay thành công!', 'success');
        setHomestays([res.data.data, ...homestays]);
        setShowHomestayModal(false);
        setNewHomestay({ name: '', description: '', facilities_text: '', address: '', status: 'active', images_text: '' });
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi thêm Homestay', 'error');
    }
  };

  const submitRoomType = async () => {
    const token = sessionStorage.getItem('token');
    if (!newRoomType.hotel_id || !newRoomType.name || !newRoomType.base_price || !newRoomType.capacity) {
      showToast('Vui lòng nhập đủ thông tin bắt buộc!', 'warning');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/admin/catalog/room-types', newRoomType, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('Thêm Loại phòng thành công!', 'success');
        setShowRoomTypeModal(false);
        setNewRoomType({ hotel_id: '', name: '', base_price: '', capacity: '', room_amenities_text: '' });
        // Tải lại danh sách
        const resList = await axios.get('http://localhost:5000/api/admin/catalog/room-types', { headers: { Authorization: `Bearer ${token}` } });
        setRoomTypes(resList.data.data || []);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi thêm Loại phòng', 'error');
    }
  };

  const handleEditHomestay = (homestay) => {
    setEditingHomestay({ ...homestay });
    setShowEditHomestayModal(true);
  };
  const handleSaveEditHomestay = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/admin/catalog/hotels/${editingHomestay.id}`, editingHomestay, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Cập nhật khách sạn thành công', 'success');
      setShowEditHomestayModal(false);
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/hotels', { headers: { Authorization: `Bearer ${token}` } });
      setHomestays(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật khách sạn', 'error');
    }
  };
  const handleDeleteHomestay = async (id) => {
    const confirm = await showConfirm('Xóa Khách sạn', 'Xóa khách sạn này sẽ xóa mọi thứ liên quan. Bạn chắc chứ?');
    if (!confirm.isConfirmed) return;
    const token = sessionStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/admin/catalog/hotels/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Xóa khách sạn thành công', 'success');
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/hotels', { headers: { Authorization: `Bearer ${token}` } });
      setHomestays(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa khách sạn', 'error');
    }
  };

  const handleEditRoomType = (roomType) => {
    setEditingRoomType({ ...roomType });
    setShowEditRoomTypeModal(true);
  };
  const handleSaveEditRoomType = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/admin/catalog/room-types/${editingRoomType.id}`, editingRoomType, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Cập nhật loại phòng thành công', 'success');
      setShowEditRoomTypeModal(false);
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/room-types', { headers: { Authorization: `Bearer ${token}` } });
      setRoomTypes(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật loại phòng', 'error');
    }
  };
  const handleDeleteRoomType = async (id) => {
    const confirm = await showConfirm('Xóa Loại phòng', 'Không thể xóa nếu loại phòng này đang có phòng vật lý. Tiếp tục?');
    if (!confirm.isConfirmed) return;
    const token = sessionStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/admin/catalog/room-types/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Xóa loại phòng thành công', 'success');
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/room-types', { headers: { Authorization: `Bearer ${token}` } });
      setRoomTypes(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa loại phòng', 'error');
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom({ ...room });
    setShowEditRoomModal(true);
  };
  const handleSaveEditRoom = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/admin/catalog/rooms/${editingRoom.id}`, editingRoom, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Cập nhật phòng thành công', 'success');
      setShowEditRoomModal(false);
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/rooms', { headers: { Authorization: `Bearer ${token}` } });
      setRooms(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật phòng', 'error');
    }
  };
  const handleDeleteRoom = async (id) => {
    const confirm = await showConfirm('Xóa Phòng', 'Không thể xóa nếu phòng đang có người đặt. Bạn chắc chứ?');
    if (!confirm.isConfirmed) return;
    const token = sessionStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/admin/catalog/rooms/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Xóa phòng thành công', 'success');
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/rooms', { headers: { Authorization: `Bearer ${token}` } });
      setRooms(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa phòng', 'error');
    }
  };

  const handleSaveNewPromo = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/admin/catalog/promotions', newPromo, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Thêm khuyến mãi thành công', 'success');
      setShowPromoModal(false);
      setNewPromo({ hotel_id: '', discount_code: '', discount_percent: '', valid_until: '' });
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/promotions', { headers: { Authorization: `Bearer ${token}` } });
      setPromotionsList(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi thêm khuyến mãi', 'error');
    }
  };

  const handleEditPromo = (promo) => {
    setEditingPromo({ ...promo, valid_until: new Date(promo.valid_until).toISOString().substring(0, 16) });
    setShowEditPromoModal(true);
  };

  const handleSaveEditPromo = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/admin/catalog/promotions/${editingPromo.id}`, editingPromo, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Cập nhật khuyến mãi thành công', 'success');
      setShowEditPromoModal(false);
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/promotions', { headers: { Authorization: `Bearer ${token}` } });
      setPromotionsList(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật khuyến mãi', 'error');
    }
  };

  const handleDeletePromo = async (id) => {
    const confirm = await showConfirm('Xóa Khuyến mãi', 'Bạn có chắc chắn muốn xóa khuyến mãi này?');
    if (!confirm.isConfirmed) return;
    const token = sessionStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/admin/catalog/promotions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Xóa khuyến mãi thành công', 'success');
      const resList = await axios.get('http://localhost:5000/api/admin/catalog/promotions', { headers: { Authorization: `Bearer ${token}` } });
      setPromotionsList(resList.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa khuyến mãi', 'error');
    }
  };

  const submitRoom = async () => {
    const token = sessionStorage.getItem('token');
    if (!newRoom.room_type_id || !newRoom.room_number) {
      showToast('Vui lòng nhập loại phòng và số phòng!', 'warning');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/admin/catalog/rooms', newRoom, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('Thêm Phòng thành công!', 'success');
        setShowRoomModal(false);
        setNewRoom({ room_type_id: '', room_number: '', status: 'available' });
        // Tải lại danh sách
        const resList = await axios.get('http://localhost:5000/api/admin/catalog/rooms', { headers: { Authorization: `Bearer ${token}` } });
        setRooms(resList.data.data || []);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi thêm Phòng', 'error');
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'awaiting_confirmation': return { text: 'Chờ duyệt', class: 'status-pending' };
      case 'confirmed': return { text: 'Đã duyệt', class: 'status-confirmed' };
      case 'pending': return { text: 'Chờ xử lý', class: 'status-pending' };
      case 'replied': return { text: 'Đã phản hồi', class: 'status-confirmed' };
      default: return { text: status, class: '' };
    }
  };

  if (!user) return null;

  return (
    <div className="admin-dashboard-fullscreen animate-fade-in" style={{ flexDirection: 'row' }}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="text-gradient">Bảo Lộc Stay</span>
        </div>
        <nav className="dashboard-nav">
          <div className="sidebar-heading">Thống kê & Tổng quan</div>
          <button
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <PieChart size={18} /> Tổng quan
          </button>
          
          <div className="sidebar-heading">Quản lý Đơn hàng</div>
          <button
            className={`nav-btn ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <DollarSign size={18} /> Quản lý Đơn & Doanh thu
          </button>
          {user.roleId === 1 && (
            <button
              className={`nav-btn ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <ShieldCheck size={18} /> Duyệt thanh toán VietQR
            </button>
          )}
          
          {user.roleId !== 4 && (
            <>
              <div className="sidebar-heading">Quản lý Lưu trú</div>
              <button
                className={`nav-btn ${activeTab === 'homestays' ? 'active' : ''}`}
                onClick={() => setActiveTab('homestays')}
              >
                <HomeIcon size={18} /> Quản lý Homestay
              </button>
              <button
                className={`nav-btn ${activeTab === 'roomTypes' ? 'active' : ''}`}
                onClick={() => setActiveTab('roomTypes')}
              >
                <Grid size={18} /> Loại phòng
              </button>
              <button
                className={`nav-btn ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('rooms')}
              >
                <Layers size={18} /> Phòng
              </button>
              <button
                className={`nav-btn ${activeTab === 'promotions' ? 'active' : ''}`}
                onClick={() => setActiveTab('promotions')}
              >
                <Award size={18} /> Quản lý Khuyến mãi
              </button>
            </>
          )}

          <div className="sidebar-heading">Khách hàng & Đánh giá</div>
          <button
            className={`nav-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <Star size={18} /> Quản lý Đánh giá
          </button>
          <button
            className={`nav-btn ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <MessageSquare size={18} /> Tin nhắn hỗ trợ
          </button>

          {user.roleId === 1 && (
            <>
              <div className="sidebar-heading">Hệ thống</div>
              <button
                className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={18} /> Quản lý Tài khoản
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-btn logout-btn"
            onClick={() => {
              sessionStorage.removeItem('user');
              sessionStorage.removeItem('token');
              navigate('/auth');
            }}
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="dashboard-main-wrapper">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h1>Admin Dashboard</h1>
          </div>
          <div className="topbar-right">
            <span className="user-greeting"><span className="status-indicator"></span> Xin chào, <strong>{user.full_name || user.email || 'Quản trị viên'}</strong></span>
            <button className="btn-topbar" onClick={() => navigate('/')}>
              <HomeIcon size={16} /> Trang Chủ
            </button>
          </div>
        </header>

        <main className="dashboard-main-content">
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <DashboardStats />
              <RevenueChart />
              <RecentTransactions />
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Chi tiết Nguồn thu</h2>
                  <div className="dashboard-filters" style={{ display: 'flex', gap: '10px' }}>
                    <select className="filter-select" value={revenueFilterYear} onChange={e => setRevenueFilterYear(e.target.value)}>
                      <option value="all">Tất cả các năm</option>
                      {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>Năm {y}</option>
                      ))}
                    </select>
                    <select className="filter-select" value={revenueFilterMonth} onChange={e => setRevenueFilterMonth(e.target.value)}>
                      <option value="all">Tất cả các tháng</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                      ))}
                    </select>
                    <select className="filter-select" value={revenueFilterWeek} onChange={e => setRevenueFilterWeek(e.target.value)}>
                      <option value="all">Tất cả các tuần</option>
                      {[...Array(53)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Tuần {i + 1}</option>
                      ))}
                    </select>
                    <select className="filter-select" value={revenueFilterHomestay} onChange={e => setRevenueFilterHomestay(e.target.value)}>
                      <option value="all">Tất cả Homestay</option>
                      {[...new Set(payments.map(p => p.homestayName))].filter(Boolean).map(hName => (
                        <option key={hName} value={hName}>{hName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {loading ? (
                  <p>Đang tải dữ liệu...</p>
                ) : (
                  <div className="table-responsive">
                    {(() => {
                      const validRevenue = payments.filter(p => {
                        const st = p.status || p.payment_status || 'pending';
                        if (!['paid', 'confirmed', 'checked_in', 'checked_out', 'completed'].includes(st)) return false;
                        if (!p.created_at) return false;

                        const pDate = new Date(p.created_at);

                        if (revenueFilterYear !== 'all') {
                          if (pDate.getUTCFullYear().toString() !== revenueFilterYear.toString()) return false;
                        }
                        if (revenueFilterMonth !== 'all') {
                          if ((pDate.getUTCMonth() + 1).toString() !== revenueFilterMonth.toString()) return false;
                        }
                        if (revenueFilterWeek !== 'all') {
                          if (getWeekNumber(pDate).toString() !== revenueFilterWeek.toString()) return false;
                        }
                        if (revenueFilterHomestay !== 'all') {
                          if (p.homestayName !== revenueFilterHomestay) return false;
                        }
                        return true;
                      });

                      const totalRevenue = validRevenue.reduce((sum, p) => sum + Number(p.amount || p.total_amount || 0), 0);

                      let filteredTopHotel = null;
                      let filteredTopRoomType = null;

                      if (validRevenue.length > 0) {
                        const hotelStats = {};
                        validRevenue.forEach(p => {
                          const hName = p.homestayName || 'Khách sạn chưa rõ';
                          const amount = Number(p.amount || p.total_amount || 0);
                          if (!hotelStats[hName]) {
                            hotelStats[hName] = { name: hName, totalRevenue: 0, totalBookings: 0 };
                          }
                          hotelStats[hName].totalRevenue += amount;
                          hotelStats[hName].totalBookings += 1;
                        });
                        const sortedHotels = Object.values(hotelStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
                        filteredTopHotel = sortedHotels[0];

                        if (filteredTopHotel) {
                          const roomStats = {};
                          validRevenue.filter(p => (p.homestayName || 'Khách sạn chưa rõ') === filteredTopHotel.name).forEach(p => {
                            const rName = p.roomName || 'Phòng chưa rõ';
                            if (!roomStats[rName]) {
                              roomStats[rName] = { name: rName, totalBookings: 0 };
                            }
                            roomStats[rName].totalBookings += 1;
                          });
                          const sortedRooms = Object.values(roomStats).sort((a, b) => b.totalBookings - a.totalBookings);
                          filteredTopRoomType = sortedRooms[0];
                        }
                      }

                      return (
                        <>
                          {validRevenue.length > 0 && filteredTopHotel && (
                            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                              <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                                <div className="stat-header">
                                  <h3 className="stat-title">Khách sạn có doanh thu cao nhất (Theo bộ lọc)</h3>
                                  <div className="stat-icon-box success">
                                    <Building size={24} />
                                  </div>
                                </div>
                                <div className="stat-value" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                  {filteredTopHotel.name}
                                </div>
                                <div className="stat-badge-container" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                  <span className="stat-badge positive" style={{ fontSize: '0.85rem' }}>
                                    <DollarSign size={14} />
                                    {filteredTopHotel.totalRevenue.toLocaleString('vi-VN')} ₫
                                  </span>
                                  <span className="stat-compare" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <CheckCircle2 size={14} />
                                    {filteredTopHotel.totalBookings} lượt đặt
                                  </span>
                                </div>
                                {filteredTopRoomType && (
                                   <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                     <Award size={18} color="#f59e0b" />
                                     <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                                       Phòng đặt nhiều nhất: <strong>{filteredTopRoomType.name}</strong> ({filteredTopRoomType.totalBookings} lượt)
                                     </span>
                                   </div>
                                )}
                              </div>
                            </div>
                          )}
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Mã Đơn</th>
                              <th>Khách hàng</th>
                              <th>Homestay</th>
                              <th>Phòng</th>
                              <th>Số tiền (VNĐ)</th>
                              <th>Trạng thái</th>
                              <th>Ngày tạo</th>
                              {user && user.roleId !== 1 && <th style={{ textAlign: 'center' }}>Hành động</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {validRevenue.map((p, index) => {
                              const st = p.status || p.payment_status || 'pending';
                              return (
                                <tr key={`${p.id || p.bookingId}-${index}`}>
                                  <td>#{p.id || p.bookingId}</td>
                                  <td>{p.guest_name || p.userEmail}</td>
                                  <td>{p.homestayName || 'Homestay'}</td>
                                  <td>{p.roomName || 'Phòng'}</td>
                                  <td style={{ fontWeight: 'bold', color: '#10b981' }}>
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.amount || p.total_amount || 0)}
                                  </td>
                                  <td>
                                    <span className={`status-badge status-${st === 'checked_in' ? 'confirmed' : st}`}>
                                      {(st === 'paid' || st === 'confirmed') ? 'Đã thanh toán' : (st === 'checked_in' ? 'Đang sử dụng' : (st === 'completed' ? 'Hoàn tất' : st))}
                                    </span>
                                  </td>
                                  <td>{p.created_at ? formatLocalDateOnly(p.created_at) : ''}</td>
                                  {user && user.roleId !== 1 && (
                                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      {(st === 'paid' || st === 'confirmed') && (
                                        <button
                                          className="btn btn-sm"
                                          onClick={() => handleCheckIn(p.id || p.bookingId)}
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                        >
                                          <ArrowRight size={14} /> Nhận phòng
                                        </button>
                                      )}
                                      {st === 'checked_in' && (
                                        <button
                                          className="btn btn-sm"
                                          onClick={() => handleCheckOut(p.id || p.bookingId)}
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                        >
                                          <LogOut size={14} /> Trả phòng
                                        </button>
                                      )}
                                      {user && user.roleId !== 4 && (
                                        <button
                                          className="btn btn-sm"
                                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#94a3b8', border: '1px solid transparent', borderRadius: '6px', padding: '4px 8px', transition: 'all 0.2s' }}
                                          onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }} onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                                          onClick={() => handleDeleteOrder(p.id || p.bookingId)} title="Xóa đơn hàng"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                            {validRevenue.length === 0 && (
                              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu doanh thu</td></tr>
                            )}
                            {validRevenue.length > 0 && (
                              <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
                                <td colSpan="4" style={{ textAlign: 'right', fontSize: '1.1rem', paddingTop: '15px', paddingBottom: '15px' }}>TỔNG CỘNG:</td>
                                <td colSpan="4" style={{ color: '#10b981', fontSize: '1.1rem', paddingTop: '15px', paddingBottom: '15px' }}>
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Quản lý Đơn hàng</h2>
                  <div className="dashboard-filters">
                    <input type="text" placeholder="Tìm kiếm theo mã đơn (VD: 15)..." className="filter-input" value={searchPayment} onChange={e => setSearchPayment(e.target.value)} />
                    <select className="filter-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
                      <option value="all">Tất cả trạng thái</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="confirmed">Thành công</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <p>Đang tải dữ liệu...</p>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã Đơn</th>
                          <th>Khách hàng</th>
                          <th>Homestay</th>
                          <th>Số tiền</th>
                          <th>Trạng thái</th>
                          <th style={{ textAlign: 'center' }}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.filter(pay => {
                          if (searchPayment) {
                            const bId = String(pay.bookingId || pay.id || '');
                            if (!bId.includes(searchPayment)) return false;
                          }
                          if (filterPayment === 'all') return true;
                          const payStatus = pay.status || pay.payment_status || 'pending';
                          if (filterPayment === 'pending') return payStatus === 'pending' || payStatus === 'awaiting_confirmation' || payStatus === 'refund_pending';
                          if (filterPayment === 'confirmed') return payStatus === 'paid' || payStatus === 'confirmed' || payStatus === 'completed' || payStatus === 'checked_in';
                          if (filterPayment === 'cancelled') return payStatus === 'cancelled';
                          return true;
                        }).map((pay, index) => {
                          const payStatus = pay.status || pay.payment_status || 'pending';
                          let badgeClass = 'status-pending';
                          let badgeText = 'Chờ duyệt';

                          if (payStatus === 'paid' || payStatus === 'confirmed') {
                            badgeClass = 'status-confirmed';
                            badgeText = 'Thành công';
                          } else if (payStatus === 'cancelled') {
                            badgeClass = 'status-cancelled';
                            badgeText = 'Đã hủy';
                          } else if (payStatus === 'refund_pending') {
                            badgeClass = 'status-pending';
                            badgeText = 'Yêu cầu Trả phòng sớm';
                          } else if (payStatus === 'checked_in') {
                            badgeClass = 'status-confirmed';
                            badgeText = 'Đang sử dụng';
                          } else if (payStatus === 'completed') {
                            badgeClass = 'status-confirmed';
                            badgeText = 'Hoàn tất';
                          }

                          const bId = pay.bookingId || pay.id;
                          const amount = pay.amount || pay.total_amount || 0;
                          const refundAmount = pay.refund_amount || 0;

                          return (
                            <tr key={pay.id}>
                              <td><strong>#{bId}</strong></td>
                              <td>{pay.userEmail || `User #${pay.user_id || 'N/A'}`}</td>
                              <td>{pay.homestayName || pay.hotel_name || 'N/A'}</td>
                              <td>
                                <span className="price-tag">{amount.toLocaleString('vi-VN')} ₫</span>

                                {payStatus === 'refund_pending' && refundAmount > 0 && (
                                  <div style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '4px', fontSize: '0.9rem' }}>
                                    Hoàn: {refundAmount.toLocaleString('vi-VN')} ₫
                                  </div>
                                )}
                              </td>
                              <td>
                                {payStatus === 'refund_pending' ? (
                                  <span className="status-badge" style={{ backgroundColor: '#f97316', color: 'white' }}>{badgeText}</span>
                                ) : (
                                  <span className={`status-badge ${badgeClass}`}>{badgeText}</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'grid', gridTemplateColumns: '130px 100px', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ textAlign: 'right' }}>
                                    {(payStatus === 'awaiting_confirmation' || payStatus === 'pending_payment') && (
                                      <button
                                        className="btn btn-sm action-btn"
                                        onClick={() => handleVerifyPayment(bId)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 12px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)', transition: 'all 0.2s', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        title="Xác nhận khách đã thanh toán tiền"
                                      >
                                        <Check size={14} /> Duyệt tiền
                                      </button>
                                    )}
                                    {payStatus === 'refund_pending' && (
                                      <button
                                        className="btn btn-sm action-btn"
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 12px', boxShadow: '0 2px 4px rgba(249, 115, 22, 0.15)', transition: 'all 0.2s', border: 'none', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white' }}
                                        onClick={() => handleApproveRefund(pay)}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                      >
                                        <RefreshCw size={14} /> Hoàn tiền
                                      </button>
                                    )}
                                    {(payStatus === 'paid' || payStatus === 'confirmed') && (
                                      <button
                                        className="btn btn-sm action-btn"
                                        onClick={() => handleCheckIn(bId)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 12px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)', transition: 'all 0.2s', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                      >
                                        <ArrowRight size={14} /> Nhận phòng
                                      </button>
                                    )}
                                    {payStatus === 'checked_in' && (
                                      <button
                                        className="btn btn-sm action-btn"
                                        onClick={() => handleCheckOut(bId)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 12px', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.15)', transition: 'all 0.2s', border: 'none', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white' }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                      >
                                        <LogOut size={14} /> Trả phòng
                                      </button>
                                    )}
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                      className="btn btn-sm action-btn"
                                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 12px', transition: 'all 0.2s', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569' }}
                                      onClick={() => setSelectedOrder(pay)}
                                      onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; }}
                                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
                                    >
                                      <Eye size={14} /> Chi tiết
                                    </button>
                                    <button
                                      className="btn btn-sm action-btn"
                                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px', padding: '6px 12px', transition: 'all 0.2s', border: '1px solid #fecaca', backgroundColor: 'white', color: '#dc2626' }}
                                      onClick={() => handleDeleteOrder(bId)}
                                      onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#fecaca'; }}
                                      title="Xóa đơn"
                                    >
                                      <Trash2 size={14} /> Xóa
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {payments.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không có yêu cầu thanh toán nào.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Quản lý Tài khoản Người dùng</h2>
                  <div className="dashboard-filters">
                    <input type="text" placeholder="Tìm kiếm theo email người dùng..." className="filter-input" value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                    <select className="filter-select" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                      <option value="all">Tất cả quyền</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>
                {loading ? <p>Đang tải dữ liệu...</p> : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Email</th>
                          <th>Phân quyền</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.filter(u => {
                          if (searchUser && !u.email?.toLowerCase().includes(searchUser.toLowerCase())) return false;
                          if (filterUser === 'all') return true;
                          if (filterUser === 'admin') return u.role_id === 1;
                          if (filterUser === 'owner') return u.role_id === 2;
                          if (filterUser === 'customer') return u.role_id === 3;
                          if (filterUser === 'staff') return u.role_id === 4;
                          return true;
                        }).map(u => (
                          <tr key={u.id} className={u.is_blocked ? 'text-muted' : ''}>
                            <td>#{u.id}</td>
                            <td><strong>{u.email}</strong></td>
                            <td>
                              <span className="status-badge" style={{ backgroundColor: u.role_id === 1 ? '#e11d48' : (u.role_id === 2 ? '#2563eb' : (u.role_id === 4 ? '#059669' : '#4b5563')), color: 'white' }}>
                                {u.role_id === 1 ? 'Admin' : (u.role_id === 2 ? 'Owner' : (u.role_id === 4 ? 'Staff' : 'Customer'))}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${u.is_blocked ? 'status-cancelled' : 'status-confirmed'}`}>
                                {u.is_blocked ? 'Đã khóa' : 'Hoạt động'}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-outline btn-sm action-btn" onClick={() => handleUpdateRole(u.id, u.role_id)}>Đổi Quyền</button>
                              <button className={`btn btn-sm action-btn ${u.is_blocked ? 'btn-primary' : 'btn-outline'}`} style={{ marginLeft: '4px' }} onClick={() => handleBlockUser(u.id, u.is_blocked)}>
                                {u.is_blocked ? 'Mở khóa' : 'Khóa'}
                              </button>
                              <button className="btn btn-danger btn-sm action-btn" style={{ marginLeft: '4px' }} onClick={() => handleDeleteUser(u.id)}>Xóa</button>
                            </td>
                          </tr>
                        ))}
                        {usersList.length === 0 && (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Không có người dùng nào.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Quản lý Đánh giá Khách sạn</h2>
                  <div className="dashboard-filters">
                    <input type="text" placeholder="Tìm kiếm email, khách sạn, nội dung..." className="filter-input" value={searchReview} onChange={e => setSearchReview(e.target.value)} />
                    <select className="filter-select" value={filterReview} onChange={e => setFilterReview(e.target.value)}>
                      <option value="all">Tất cả trạng thái</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="hidden">Đã ẩn</option>
                    </select>
                  </div>
                </div>
                {loading ? <p>Đang tải dữ liệu...</p> : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>User ID</th>
                          <th>Khách sạn</th>
                          <th>Đánh giá</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewsList.filter(r => {
                          if (searchReview) {
                            const term = searchReview.toLowerCase();
                            const match = r.comment?.toLowerCase().includes(term) || r.user_email?.toLowerCase().includes(term) || r.hotel_name?.toLowerCase().includes(term);
                            if (!match) return false;
                          }
                          if (filterReview === 'all') return true;
                          return (r.status || 'pending') === filterReview;
                        }).map(r => (
                          <tr key={r.id}>
                            <td style={{ color: '#64748b', fontWeight: 500 }}>#{r.id}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.user_email?.split('@')[0]}</span>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.user_email}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: 500, color: '#334155' }}>{r.hotel_name}</td>
                            <td style={{ maxWidth: '320px', padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} size={14} fill={i < r.rating_score ? "#f59e0b" : "#e2e8f0"} color={i < r.rating_score ? "#f59e0b" : "#e2e8f0"} />
                                ))}
                                <span style={{ marginLeft: '6px', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>{r.rating_score}/5</span>
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.5', marginBottom: r.reply_comment ? '8px' : '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={r.comment}>
                                "{r.comment}"
                              </div>
                              {r.reply_comment && (
                                <div style={{ fontSize: '0.85rem', color: '#0f172a', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #3b82f6', marginTop: '8px' }}>
                                  <strong style={{ color: '#3b82f6' }}>Phản hồi từ {r.hotel_name}:</strong> {r.reply_comment}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                                backgroundColor: r.status === 'approved' ? '#dcfce7' : (r.status === 'hidden' ? '#fee2e2' : '#fef3c7'),
                                color: r.status === 'approved' ? '#16a34a' : (r.status === 'hidden' ? '#dc2626' : '#d97706')
                              }}>
                                {r.status === 'approved' ? <CheckCircle2 size={14} /> : (r.status === 'hidden' ? <XCircle size={14} /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />)}
                                {r.status === 'approved' ? 'Đã duyệt' : (r.status === 'hidden' ? 'Đã ẩn' : 'Chờ duyệt')}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '200px' }}>
                                {r.status !== 'approved' && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', fontWeight: 600, transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#d1fae5'} onMouseOut={e => e.currentTarget.style.background = '#ecfdf5'}
                                    onClick={() => handleUpdateReviewStatus(r.id, 'approved')} title="Duyệt đánh giá"
                                  >
                                    <Check size={14} /> Duyệt
                                  </button>
                                )}
                                {r.status !== 'hidden' && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 600, transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}
                                    onClick={() => handleUpdateReviewStatus(r.id, 'hidden')} title="Ẩn đánh giá"
                                  >
                                    <Eye size={14} style={{ textDecoration: 'line-through' }} /> Ẩn
                                  </button>
                                )}
                                {!r.reply_comment && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 600, transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#dbeafe'} onMouseOut={e => e.currentTarget.style.background = '#eff6ff'}
                                    onClick={() => { setReplyingReviewId(r.id); setReplyText(''); }} title="Trả lời khách hàng"
                                  >
                                    <MessageCircle size={14} /> Trả lời
                                  </button>
                                )}
                                <button
                                  className="btn btn-sm"
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#94a3b8', border: '1px solid transparent', borderRadius: '6px', padding: '4px 8px', transition: 'all 0.2s' }}
                                  onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }} onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                                  onClick={() => handleDeleteReview(r.id)} title="Xóa vĩnh viễn"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {reviewsList.length === 0 && (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không có đánh giá nào.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Tin nhắn hỗ trợ từ Khách hàng</h2>
                  <div className="dashboard-filters">
                    <input type="text" placeholder="Tìm kiếm theo họ tên, email..." className="filter-input" value={searchContact} onChange={e => setSearchContact(e.target.value)} />
                    <select className="filter-select" value={filterContact} onChange={e => setFilterContact(e.target.value)}>
                      <option value="all">Tất cả tin nhắn</option>
                      <option value="pending">Chưa xử lý</option>
                      <option value="replied">Đã xử lý</option>
                    </select>
                  </div>
                </div>
                {loading ? (
                  <p>Đang tải dữ liệu...</p>
                ) : (
                  <div className="contact-messages-list">
                    {contacts.filter(contact => {
                      if (searchContact) {
                        const term = searchContact.toLowerCase();
                        const match = contact.email?.toLowerCase().includes(term) || contact.ten?.toLowerCase().includes(term) || contact.ho_lot?.toLowerCase().includes(term);
                        if (!match) return false;
                      }
                      if (filterContact === 'all') return true;
                      return (contact.status || 'pending') === filterContact;
                    }).map(contact => {
                      const statusConf = getStatusLabel(contact.status || 'pending');
                      return (
                        <div className={`contact-card ${contact.status === 'replied' ? 'replied' : ''}`} key={contact.id}>
                          <div className="contact-card-header">
                            <div className="user-info">
                              <strong>{contact.ho_lot} {contact.ten}</strong>
                              <span className="contact-meta"><Mail size={14} /> {contact.email}</span>
                            </div>
                            <span className={`status-badge ${statusConf.class}`}>{statusConf.text}</span>
                          </div>
                          <div className="contact-body">
                            <p>"{contact.loi_nhan}"</p>
                            <span className="msg-date"><Calendar size={12} /> {formatLocalDate(contact.created_at)}</span>
                          </div>
                          <div className="contact-footer" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {contact.status !== 'replied' && (
                              <button
                                className="btn btn-outline btn-sm action-btn"
                                onClick={() => handleReplyContact(contact.id)}
                              >
                                <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                Đánh dấu hoàn tất
                              </button>
                            )}
                            <a href={`mailto:${contact.email}`} className="btn btn-primary btn-sm action-btn" style={{ textDecoration: 'none' }}>
                              <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Gửi Email
                            </a>
                            {contact.status === 'replied' && (
                              <span className="text-muted" style={{ marginLeft: 'auto' }}>
                                <CheckCircle size={14} color="var(--status-confirmed)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Đã xử lý xong
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {contacts.length === 0 && <p>Chưa có tin nhắn hỗ trợ nào.</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'homestays' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Danh sách Homestay của bạn</h2>
                  <div className="dashboard-filters">
                    <input type="text" placeholder="Tìm kiếm theo tên homestay, địa chỉ..." className="filter-input" value={searchHomestay} onChange={e => setSearchHomestay(e.target.value)} />
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', borderRadius: '8px', padding: '0.65rem 1.25rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)', fontWeight: 600 }} onClick={() => setShowHomestayModal(true)}><Plus size={18} /> Thêm mới</button>
                  </div>
                </div>
                {loading ? (
                  <p>Đang tải dữ liệu...</p>
                ) : (
                  <div className="homestay-list-admin">
                    {homestays.filter(home => {
                      if (searchHomestay) {
                        const term = searchHomestay.toLowerCase();
                        return home.name?.toLowerCase().includes(term) || home.address?.toLowerCase().includes(term);
                      }
                      return true;
                    }).map(home => (
                      <div className="homestay-card" key={home.id}>
                        <div className="user-info">
                          <strong><span style={{ color: '#0ea5e9', marginRight: '6px' }}>#{home.id}</span> {home.name}</strong>
                          <span className="contact-meta"><MapPin size={14} /> {home.address}</span>
                        </div>
                        <div className="actions">
                          <button className="btn btn-outline btn-sm action-btn" onClick={() => handleEditHomestay(home)}>Sửa</button>
                          <button className="btn btn-danger btn-sm action-btn" style={{ marginLeft: '8px' }} onClick={() => handleDeleteHomestay(home.id)}>Xóa</button>
                        </div>
                      </div>
                    ))}
                    {homestays.length === 0 && <p>Bạn chưa có Homestay nào.</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'roomTypes' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Danh sách Loại phòng</h2>
                  <div className="dashboard-filters">
                    <input type="text" placeholder="Tìm kiếm theo tên loại phòng, khách sạn..." className="filter-input" value={searchRoomType} onChange={e => setSearchRoomType(e.target.value)} />
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', borderRadius: '8px', padding: '0.65rem 1.25rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)', fontWeight: 600 }} onClick={() => setShowRoomTypeModal(true)}><Plus size={18} /> Thêm mới</button>
                  </div>
                </div>
                {loading ? (
                  <p>Đang tải dữ liệu...</p>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Khách sạn</th>
                          <th>Tên Loại phòng</th>
                          <th>Giá</th>
                          <th>Sức chứa</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomTypes.filter(rt => {
                          if (searchRoomType) {
                            const term = searchRoomType.toLowerCase();
                            return rt.name?.toLowerCase().includes(term) || rt.hotel_name?.toLowerCase().includes(term);
                          }
                          return true;
                        }).map(rt => {
                          const price = rt.base_price || rt.price || 0;
                          return (
                            <tr key={rt.id}>
                              <td>#{rt.id}</td>
                              <td>{rt.hotel_name}</td>
                              <td><strong>{rt.name}</strong></td>
                              <td><span className="price-tag">{price.toLocaleString('vi-VN')} ₫</span></td>
                              <td>{rt.capacity} người</td>
                              <td>
                                <button className="btn btn-outline btn-sm action-btn" onClick={() => handleEditRoomType(rt)}>Sửa</button>
                                <button className="btn btn-danger btn-sm action-btn" style={{ marginLeft: '4px' }} onClick={() => handleDeleteRoomType(rt.id)}>Xóa</button>
                              </td>
                            </tr>
                          )
                        })}
                        {roomTypes.length === 0 && (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không có loại phòng nào.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Danh sách Phòng</h2>
                  <div className="dashboard-filters">
                    <input type="text" placeholder="Tìm kiếm số phòng, loại phòng, khách sạn..." className="filter-input" value={searchRoom} onChange={e => setSearchRoom(e.target.value)} />
                    <select className="filter-select" value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
                      <option value="all">Tất cả trạng thái</option>
                      <option value="available">Trống</option>
                      <option value="occupied">Đang có khách</option>
                      <option value="maintenance">Đang bảo trì/dọn</option>
                    </select>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', borderRadius: '8px', padding: '0.65rem 1.25rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)', fontWeight: 600 }} onClick={() => setShowRoomModal(true)}><Plus size={18} /> Thêm mới</button>
                  </div>
                </div>
                {loading ? (
                  <p>Đang tải dữ liệu...</p>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Khách sạn</th>
                          <th>Loại phòng</th>
                          <th>Tên/Số Phòng</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.filter(r => {
                          if (searchRoom) {
                            const term = searchRoom.toLowerCase();
                            const rName = String(r.room_number || r.name || '').toLowerCase();
                            if (!rName.includes(term) && !r.hotel_name?.toLowerCase().includes(term) && !r.room_type_name?.toLowerCase().includes(term)) return false;
                          }
                          if (filterRoom === 'all') return true;
                          return (r.current_status || r.status) === filterRoom;
                        }).map(r => (
                          <tr key={r.id}>
                            <td>#{r.id}</td>
                            <td>{r.hotel_name}</td>
                            <td>{r.room_type_name}</td>
                            <td><strong>{r.room_number || r.name}</strong></td>
                            <td>
                              <span className={`status-badge ${(r.current_status || r.status) === 'available' ? 'status-confirmed' : ((r.current_status || r.status) === 'occupied' ? 'status-cancelled' : 'status-pending')}`}>
                                {(r.current_status || r.status) === 'available' ? 'Trống' : ((r.current_status || r.status) === 'occupied' ? 'Đang có khách' : 'Đang bảo trì/dọn')}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-outline btn-sm action-btn" onClick={() => handleEditRoom(r)}>Sửa</button>
                              <button className="btn btn-danger btn-sm action-btn" style={{ marginLeft: '4px' }} onClick={() => handleDeleteRoom(r.id)}>Xóa</button>
                            </td>
                          </tr>
                        ))}
                        {rooms.length === 0 && (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không có phòng nào.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'promotions' && (
            <div className="tab-pane">
              <div className="dashboard-card">
                <div className="dashboard-header-flex">
                  <h2 className="dashboard-title">Quản lý Khuyến mãi (Mã Giảm Giá)</h2>
                  <button className="btn btn-primary action-btn" onClick={() => setShowPromoModal(true)}>
                    <Plus size={16} style={{ display: 'inline', marginRight: '5px' }} /> Thêm Khuyến mãi
                  </button>
                </div>
                {loading ? <p>Đang tải dữ liệu...</p> : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Khách sạn</th>
                          <th>Mã Giảm Giá</th>
                          <th>Phần Trăm Giảm</th>
                          <th>Hạn Sử Dụng</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promotionsList.map(p => {
                          const dateObj = new Date(p.valid_until);
                          const isExpired = dateObj < new Date();
                          return (
                            <tr key={p.id}>
                              <td>#{p.id}</td>
                              <td style={{ fontWeight: 600 }}>{p.hotel_id ? p.hotel_name : 'Toàn hệ thống'}</td>
                              <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{p.discount_code}</td>
                              <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{p.discount_percent}%</td>
                              <td>
                                <span style={{ color: isExpired ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
                                  {formatLocalDateOnly(p.valid_until)} {isExpired ? '(Đã hết hạn)' : ''}
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-outline btn-sm action-btn" onClick={() => handleEditPromo(p)}>Sửa</button>
                                <button className="btn btn-danger btn-sm action-btn" style={{ marginLeft: '4px' }} onClick={() => handleDeletePromo(p.id)}>Xóa</button>
                              </td>
                            </tr>
                          );
                        })}
                        {promotionsList.length === 0 && (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không có mã khuyến mãi nào.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {replyingReviewId && (
        <div className="admin-modal-overlay" onClick={() => setReplyingReviewId(null)}>
          <div className="admin-modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h3>Phản hồi đánh giá</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>Nội dung này sẽ được hiển thị công khai tới khách hàng.</p>
            <textarea
              placeholder="Nhập lời cảm ơn hoặc xin lỗi của bạn..."
              rows="4"
              className="form-control"
              style={{ width: '100%', marginBottom: '1rem', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            ></textarea>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setReplyingReviewId(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={submitReplyReview}>Gửi Phản hồi</button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Order Details Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999 }} onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', padding: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} /> Chi tiết đơn hàng
                </h3>
                <span style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px', display: 'block' }}>Mã đơn: #{selectedOrder.bookingId || selectedOrder.id}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>&times;</button>
            </div>

            {/* Modal Body - Receipt Style */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Khách hàng</span>
                  <span style={{ fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{selectedOrder.userEmail || `User #${selectedOrder.user_id}`}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Homestay</span>
                  <span style={{ fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{selectedOrder.homestayName || selectedOrder.hotel_name || 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Loại phòng</span>
                  <span style={{ fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{selectedOrder.roomName || 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Ngày đặt</span>
                  <span style={{ fontWeight: 500, color: '#334155', textAlign: 'right' }}>{selectedOrder.created_at ? formatLocalDate(selectedOrder.created_at) : 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Thời gian lưu trú</span>
                  <div style={{ textAlign: 'right', fontWeight: 500, color: '#334155' }}>
                    <div>{selectedOrder.check_in_datetime ? formatLocalDateOnly(selectedOrder.check_in_datetime) : 'N/A'}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>đến</div>
                    <div>{selectedOrder.check_out_datetime ? formatLocalDateOnly(selectedOrder.check_out_datetime) : 'N/A'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Phương thức</span>
                  <span style={{ fontWeight: 600, color: '#1e293b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '0.9rem' }}>
                    {selectedOrder.payment_method === 'QR_Transfer' ? 'Chuyển khoản VietQR' : selectedOrder.payment_method || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Trạng thái</span>
                  <span style={{ fontWeight: 600, color: selectedOrder.status === 'completed' || selectedOrder.status === 'checked_in' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'deposited' ? '#16a34a' : (selectedOrder.status === 'cancelled' ? '#dc2626' : '#ea580c'), backgroundColor: selectedOrder.status === 'completed' || selectedOrder.status === 'checked_in' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'deposited' ? '#dcfce7' : (selectedOrder.status === 'cancelled' ? '#fee2e2' : '#ffedd5'), padding: '4px 10px', borderRadius: '6px', fontSize: '0.9rem' }}>
                    {selectedOrder.status === 'completed' ? 'Hoàn tất' :
                      selectedOrder.status === 'checked_in' ? 'Đang sử dụng' :
                        selectedOrder.status === 'checked_out' ? 'Đã trả phòng' :
                          selectedOrder.status === 'cancelled' ? 'Đã hủy' :
                            selectedOrder.status === 'refund_pending' ? 'Yêu cầu trả phòng sớm' :
                              selectedOrder.status === 'deposited' ? 'Đã thanh toán cọc' :
                                selectedOrder.status === 'confirmed' ? 'Đã xác nhận' :
                                  selectedOrder.status === 'pending_payment' ? 'Chờ thanh toán' :
                                    'Chờ Admin duyệt'}
                  </span>
                </div>
              </div>

              {/* Total Amount Box */}
              <div style={{ marginTop: '1.5rem', background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569' }}>Tổng thanh toán</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9' }}>{(selectedOrder.amount || selectedOrder.total_amount || 0).toLocaleString('vi-VN')} ₫</span>
                </div>
                {(selectedOrder.deposit_amount !== null && selectedOrder.deposit_amount !== undefined) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>Đã cọc (30%)</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#059669' }}>{selectedOrder.deposit_amount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                {(selectedOrder.remaining_amount !== null && selectedOrder.remaining_amount !== undefined && selectedOrder.remaining_amount > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>Còn lại cần thu</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#dc2626' }}>{selectedOrder.remaining_amount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: '0.75rem', fontWeight: 600, borderRadius: '8px' }} onClick={() => setSelectedOrder(null)}>Đóng chi tiết</button>
              {(selectedOrder.status === 'awaiting_confirmation' || selectedOrder.status === 'pending_payment') && (
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.75rem', fontWeight: 600, borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => {
                    handleVerifyPayment(selectedOrder.bookingId || selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                >
                  <Check size={18} /> Duyệt tiền
                </button>
              )}
              {((selectedOrder.status === 'deposited' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'checked_in') && selectedOrder.remaining_amount > 0) && (
                <button 
                  className="btn btn-success" 
                  style={{ flex: 1, padding: '0.75rem', fontWeight: 600, borderRadius: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'white' }}
                  onClick={() => {
                    handlePayRemaining(selectedOrder.bookingId || selectedOrder.id);
                  }}
                >
                  <DollarSign size={18} /> Thu tiền còn lại
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Homestay Modal */}
      {showHomestayModal && (
        <div className="admin-modal-overlay" onClick={() => setShowHomestayModal(false)}>
          <div className="admin-modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem' }}>Thêm mới Homestay</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tên Homestay *</label>
                <input type="text" className="form-control" placeholder="Nhập tên homestay..." style={{ width: '100%' }} value={newHomestay.name} onChange={e => setNewHomestay({ ...newHomestay, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Địa chỉ *</label>
                <input type="text" className="form-control" placeholder="Nhập địa chỉ..." style={{ width: '100%' }} value={newHomestay.address} onChange={e => setNewHomestay({ ...newHomestay, address: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mô tả</label>
                <textarea className="form-control" placeholder="Mô tả về homestay..." style={{ width: '100%', resize: 'vertical' }} rows="3" value={newHomestay.description} onChange={e => setNewHomestay({ ...newHomestay, description: e.target.value })}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tiện ích chung (cách nhau bởi dấu phẩy)</label>
                <input type="text" className="form-control" placeholder="Ví dụ: WiFi, Hồ bơi, Bếp chung..." style={{ width: '100%' }} value={newHomestay.facilities_text} onChange={e => setNewHomestay({ ...newHomestay, facilities_text: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Link hình ảnh (cách nhau bởi dấu phẩy)</label>
                <input type="text" className="form-control" placeholder="https://link-anh-1.jpg, https://..." style={{ width: '100%' }} value={newHomestay.images_text} onChange={e => setNewHomestay({ ...newHomestay, images_text: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Trạng thái</label>
                <select className="form-control" style={{ width: '100%' }} value={newHomestay.status} onChange={e => setNewHomestay({ ...newHomestay, status: e.target.value })}>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setShowHomestayModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={submitHomestay}>Thêm Mới</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Type Modal */}
      {showRoomTypeModal && (
        <div className="admin-modal-overlay" onClick={() => setShowRoomTypeModal(false)}>
          <div className="admin-modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem' }}>Thêm mới Loại phòng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Thuộc Homestay *</label>
                <select className="form-control" style={{ width: '100%' }} value={newRoomType.hotel_id} onChange={e => setNewRoomType({ ...newRoomType, hotel_id: e.target.value })}>
                  <option value="">-- Chọn Homestay --</option>
                  {homestays.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tên loại phòng *</label>
                <input type="text" className="form-control" placeholder="Ví dụ: Phòng Đơn Standard, Phòng Đôi View Núi..." style={{ width: '100%' }} value={newRoomType.name} onChange={e => setNewRoomType({ ...newRoomType, name: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Giá cơ bản (VNĐ) *</label>
                  <input type="number" className="form-control" placeholder="Ví dụ: 500000" style={{ width: '100%' }} value={newRoomType.base_price} onChange={e => setNewRoomType({ ...newRoomType, base_price: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Sức chứa (người) *</label>
                  <input type="number" className="form-control" placeholder="Ví dụ: 2" style={{ width: '100%' }} value={newRoomType.capacity} onChange={e => setNewRoomType({ ...newRoomType, capacity: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tiện ích trong phòng (cách nhau bởi dấu phẩy)</label>
                <input type="text" className="form-control" placeholder="Ví dụ: Điều hòa, Máy sấy, Tivi..." style={{ width: '100%' }} value={newRoomType.room_amenities_text} onChange={e => setNewRoomType({ ...newRoomType, room_amenities_text: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setShowRoomTypeModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={submitRoomType}>Thêm Mới</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showRoomModal && (
        <div className="admin-modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="admin-modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem' }}>Thêm mới Phòng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Loại phòng *</label>
                <select className="form-control" style={{ width: '100%' }} value={newRoom.room_type_id} onChange={e => setNewRoom({ ...newRoom, room_type_id: e.target.value })}>
                  <option value="">-- Chọn Loại phòng --</option>
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.hotel_name} - {rt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tên/Số phòng *</label>
                <input type="text" className="form-control" placeholder="Ví dụ: P101, Phòng Hoa Hồng..." style={{ width: '100%' }} value={newRoom.room_number} onChange={e => setNewRoom({ ...newRoom, room_number: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Trạng thái</label>
                <select className="form-control" style={{ width: '100%' }} value={newRoom.status} onChange={e => setNewRoom({ ...newRoom, status: e.target.value })}>
                  <option value="available">Trống (Sẵn sàng)</option>
                  <option value="maintenance">Đang bảo trì/Sửa chữa</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setShowRoomModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={submitRoom}>Thêm Mới</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT HOMESTAY MODAL */}
      {showEditHomestayModal && editingHomestay && (
        <div className="modal-overlay" onClick={() => setShowEditHomestayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa Khách sạn / Homestay</h2>
              <button className="close-btn" onClick={() => setShowEditHomestayModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEditHomestay}>
              <div className="form-group">
                <label>Tên Khách sạn/Homestay</label>
                <input type="text" required value={editingHomestay.name} onChange={(e) => setEditingHomestay({ ...editingHomestay, name: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea rows="3" value={editingHomestay.description} onChange={(e) => setEditingHomestay({ ...editingHomestay, description: e.target.value })} className="form-control"></textarea>
              </div>
              <div className="form-group">
                <label>Tiện ích (cách nhau bởi dấu phẩy)</label>
                <input type="text" value={editingHomestay.facilities_text} onChange={(e) => setEditingHomestay({ ...editingHomestay, facilities_text: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input type="text" value={editingHomestay.address} onChange={(e) => setEditingHomestay({ ...editingHomestay, address: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={editingHomestay.status} onChange={(e) => setEditingHomestay({ ...editingHomestay, status: e.target.value })} className="form-control">
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditHomestayModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM TYPE MODAL */}
      {showEditRoomTypeModal && editingRoomType && (
        <div className="modal-overlay" onClick={() => setShowEditRoomTypeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa Loại phòng</h2>
              <button className="close-btn" onClick={() => setShowEditRoomTypeModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEditRoomType}>
              <div className="form-group">
                <label>Tên loại phòng</label>
                <input type="text" required value={editingRoomType.name} onChange={(e) => setEditingRoomType({ ...editingRoomType, name: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Giá cơ bản</label>
                <input type="number" required value={editingRoomType.base_price} onChange={(e) => setEditingRoomType({ ...editingRoomType, base_price: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Sức chứa (người lớn)</label>
                <input type="number" required value={editingRoomType.capacity} onChange={(e) => setEditingRoomType({ ...editingRoomType, capacity: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Tiện ích trong phòng</label>
                <input type="text" value={editingRoomType.room_amenities_text} onChange={(e) => setEditingRoomType({ ...editingRoomType, room_amenities_text: e.target.value })} className="form-control" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditRoomTypeModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {showEditRoomModal && editingRoom && (
        <div className="modal-overlay" onClick={() => setShowEditRoomModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa Phòng vật lý</h2>
              <button className="close-btn" onClick={() => setShowEditRoomModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEditRoom}>
              <div className="form-group">
                <label>Số / Tên phòng</label>
                <input type="text" required value={editingRoom.room_number} onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={editingRoom.status} onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value })} className="form-control">
                  <option value="available">Trống</option>
                  <option value="occupied">Đang có khách</option>
                  <option value="maintenance">Đang bảo trì/dọn</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditRoomModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK IN MODAL */}
      {showCheckInModal && (
        <div className="modal-overlay" onClick={() => setShowCheckInModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nhận phòng</h2>
              <button className="close-btn" onClick={() => setShowCheckInModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '10px 0' }}>
              <div className="form-group">
                <label>Số Căn cước công dân (CCCD) <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={checkInCCCD} 
                  onChange={(e) => setCheckInCCCD(e.target.value)} 
                  className="form-control" 
                  placeholder="Nhập CCCD của khách hàng"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowCheckInModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={confirmCheckIn}>Xác nhận Nhận phòng</button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đổi Quyền Người Dùng</h2>
              <button className="close-btn" onClick={() => setShowRoleModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Quyền (Role)</label>
                <select 
                  className="form-control"
                  value={roleModalData.newRole}
                  onChange={(e) => setRoleModalData({ ...roleModalData, newRole: parseInt(e.target.value) })}
                >
                  <option value={1}>1: Quản trị viên (Admin)</option>
                  <option value={2}>2: Chủ khách sạn (Owner)</option>
                  <option value={3}>3: Khách hàng (Customer)</option>
                  <option value={4}>4: Nhân viên (Staff)</option>
                </select>
              </div>
              {roleModalData.newRole === 4 && (
                <div className="form-group animate-fade-in">
                  <label>ID Khách sạn (Homestay) quản lý <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="number" 
                    required 
                    value={roleModalData.hotelId} 
                    onChange={(e) => setRoleModalData({ ...roleModalData, hotelId: e.target.value })} 
                    className="form-control" 
                    placeholder="Nhập ID Khách sạn"
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowRoleModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={submitUpdateRole}>Lưu Thay Đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* PROMO MODAL */}
      {showPromoModal && (
        <div className="modal-overlay" onClick={() => setShowPromoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm Khuyến mãi mới</h2>
              <button className="close-btn" onClick={() => setShowPromoModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveNewPromo}>
              {user.roleId === 1 && (
                <div className="form-group">
                  <label>Khách sạn áp dụng</label>
                  <select value={newPromo.hotel_id} onChange={(e) => setNewPromo({ ...newPromo, hotel_id: e.target.value })} className="form-control">
                    <option value="">Toàn hệ thống (Tất cả Khách sạn)</option>
                    {homestays.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}
              {user.roleId === 2 && (
                <div className="form-group">
                  <label>Khách sạn áp dụng <span style={{ color: 'red' }}>*</span></label>
                  <select required value={newPromo.hotel_id} onChange={(e) => setNewPromo({ ...newPromo, hotel_id: e.target.value })} className="form-control">
                    <option value="">Chọn khách sạn</option>
                    {homestays.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Mã giảm giá <span style={{ color: 'red' }}>*</span></label>
                <input type="text" required value={newPromo.discount_code} onChange={(e) => setNewPromo({ ...newPromo, discount_code: e.target.value })} className="form-control" placeholder="Ví dụ: GIAM10" />
              </div>
              <div className="form-group">
                <label>Phần trăm giảm (%) <span style={{ color: 'red' }}>*</span></label>
                <input type="number" step="0.1" required value={newPromo.discount_percent} onChange={(e) => setNewPromo({ ...newPromo, discount_percent: e.target.value })} className="form-control" placeholder="10" />
              </div>
              <div className="form-group">
                <label>Ngày hết hạn <span style={{ color: 'red' }}>*</span></label>
                <input type="datetime-local" required value={newPromo.valid_until} onChange={(e) => setNewPromo({ ...newPromo, valid_until: e.target.value })} className="form-control" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPromoModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Thêm mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROMO MODAL */}
      {showEditPromoModal && editingPromo && (
        <div className="modal-overlay" onClick={() => setShowEditPromoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa Khuyến mãi</h2>
              <button className="close-btn" onClick={() => setShowEditPromoModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEditPromo}>
              <div className="form-group">
                <label>Mã giảm giá <span style={{ color: 'red' }}>*</span></label>
                <input type="text" required value={editingPromo.discount_code} onChange={(e) => setEditingPromo({ ...editingPromo, discount_code: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Phần trăm giảm (%) <span style={{ color: 'red' }}>*</span></label>
                <input type="number" step="0.1" required value={editingPromo.discount_percent} onChange={(e) => setEditingPromo({ ...editingPromo, discount_percent: e.target.value })} className="form-control" />
              </div>
              <div className="form-group">
                <label>Ngày hết hạn <span style={{ color: 'red' }}>*</span></label>
                <input type="datetime-local" required value={editingPromo.valid_until} onChange={(e) => setEditingPromo({ ...editingPromo, valid_until: e.target.value })} className="form-control" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditPromoModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
