import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Home as HomeIcon, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { showAlert } from '../utils/alert';
import './Auth.css';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [emailError, setEmailError] = useState('');

  const showToastMessage = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      showToastMessage('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.', 'error');
    }
  }, [searchParams]);

  const evaluatePassword = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-gray-200' };
    
    let score = 0;
    const hasLettersAndNumbers = /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const hasUpperAndLower = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);

    if (pwd.length >= 6) {
      if (pwd.length >= 8 && hasLettersAndNumbers && hasUpperAndLower && hasSpecial) {
        score = 3; // Mạnh
      } else if (hasLettersAndNumbers || pwd.length >= 8) {
        score = 2; // Tạm ổn
      } else {
        score = 1; // Yếu
      }
    } else {
      score = 1; // Yếu (Dưới 6 ký tự)
    }

    if (score === 1) return { score, text: 'Mật khẩu quá yếu', color: 'bg-danger' };
    if (score === 2) return { score, text: 'Mật khẩu tạm ổn', color: 'bg-warning' };
    if (score === 3) return { score, text: 'Mật khẩu rất mạnh', color: 'bg-success' };
  };

  const pwdStrength = evaluatePassword(password);
  const isPasswordsMatch = password && confirmPassword && password === confirmPassword;

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setPhone(value);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email: email.trim(), 
        password: password.trim() 
      });
      if (res.data.success) {
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        showToastMessage('Đăng nhập thành công!', 'success');
        
        // Nếu là Admin (roleId = 1) hoặc Owner (roleId = 2) hoặc Staff (roleId = 4) thì chuyển hướng thẳng vào trang quản trị
        setTimeout(() => {
          if ([1, 2, 4].includes(parseInt(res.data.user.roleId))) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      showAlert('Lỗi Đăng Nhập', `Chi tiết lỗi: ${err.message}\nPhản hồi: ${err.response ? JSON.stringify(err.response.data) : 'Không có phản hồi'}`, 'error');
      const errorMsg = err.response?.data?.error || 'Sai email hoặc mật khẩu!';
      showToastMessage(errorMsg, 'error');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      setEmailError('');
      const res = await axios.post('http://localhost:5000/api/auth/register', { email, password, phone });
      if (res.data.success) {
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        showToastMessage('Tạo tài khoản thành công! Đang chuyển hướng...', 'success');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      showAlert('Lỗi Đăng Ký', `Chi tiết lỗi: ${err.message}\nPhản hồi: ${err.response ? JSON.stringify(err.response.data) : 'Không có phản hồi'}`, 'error');
      const errorMsg = err.response?.data?.error || 'Đăng ký thất bại!';
      if (errorMsg.includes('Email')) {
        setEmailError(errorMsg);
      }
      showToastMessage(errorMsg, 'error');
    }
  };

  const isRegisterValid = email && phone && pwdStrength.score >= 2 && isPasswordsMatch && termsAccepted;

  return (
    <div className="auth-container">
      {/* Toast Notification */}
      <div className={`toast-notification ${toast.visible ? 'show' : ''} ${toast.type}`}>
        {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        <span>{toast.message}</span>
      </div>

      <div className="auth-split">
        {/* Left Side: Visual */}
        <div className="auth-visual">
          <div className="visual-overlay"></div>
          <img src="/images/login-bg.jpg" alt="Bảo Lộc Landscape" />
          <div className="visual-content">
            <div className="brand" onClick={() => navigate('/')} title="Quay lại Trang chủ">
              <ArrowLeft size={28} style={{ marginRight: '4px', opacity: 0.9 }} />
              <HomeIcon size={28} />
              <span>BaoLoc Stay</span>
            </div>
            <div className="slogan">
              <h2>Trải nghiệm sự bình yên</h2>
              <p>Khám phá không gian nghỉ dưỡng tuyệt vời nhất tại Bảo Lộc cùng hàng ngàn tiện ích đẳng cấp.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            {isLogin ? (
              // ================= LOGIN FORM =================
              <div className="auth-form-block animate-fade-in">
                <div className="form-header">
                  <h2>Đăng nhập</h2>
                  <p>Vui lòng đăng nhập để tiếp tục</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="auth-form">
                  <div className="input-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      placeholder="Nhập email của bạn" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label>Mật khẩu</label>
                    <div className="password-input">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Nhập mật khẩu" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-actions">
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Ghi nhớ đăng nhập</span>
                    </label>
                    <a href="#" className="forgot-link">Quên mật khẩu?</a>
                  </div>

                  <button type="submit" className="btn-submit" disabled={!email || !password}>
                    Đăng nhập
                  </button>
                </form>

                <div className="auth-switch">
                  <span>Bạn chưa có tài khoản? </span>
                  <button type="button" className="switch-btn" onClick={() => setIsLogin(false)}>Đăng ký ngay</button>
                </div>
              </div>
            ) : (
              // ================= REGISTER FORM =================
              <div className="auth-form-block animate-fade-in">
                <div className="form-header">
                  <h2>Tạo tài khoản mới</h2>
                  <p>Điền thông tin bên dưới để tham gia cùng chúng tôi</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="auth-form">
                  <div className="input-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      placeholder="Nhập email của bạn" 
                      className={emailError ? 'input-error' : ''}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if(emailError) setEmailError('');
                      }}
                      required 
                    />
                    {emailError && <span className="error-text">{emailError}</span>}
                  </div>

                  <div className="input-group">
                    <label>Số điện thoại</label>
                    <input 
                      type="text" 
                      placeholder="Nhập số điện thoại" 
                      value={phone}
                      onChange={handlePhoneChange}
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label>Mật khẩu</label>
                    <div className="password-input">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Tạo mật khẩu" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* Password Strength Meter */}
                    {password && (
                      <div className="pwd-strength-meter">
                        <div className="pwd-progress-bar">
                          <div className={`pwd-progress ${pwdStrength.color}`} style={{ width: `${(pwdStrength.score / 3) * 100}%` }}></div>
                        </div>
                        <span className={`pwd-text text-${pwdStrength.color.replace('bg-', '')}`}>{pwdStrength.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Nhập lại mật khẩu</label>
                    <div className="password-input">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Xác nhận mật khẩu" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <span className={`confirm-text ${isPasswordsMatch ? 'text-success' : 'text-danger'}`}>
                        {isPasswordsMatch ? 'Mật khẩu khớp' : 'Mật khẩu không khớp'}
                      </span>
                    )}
                  </div>

                  <div className="form-actions register-actions">
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        required
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <span>Tôi đồng ý với Điều khoản và Chính sách bảo mật</span>
                    </label>
                  </div>

                  <button type="submit" className="btn-submit" disabled={!isRegisterValid}>
                    Tạo tài khoản
                  </button>
                </form>

                <div className="auth-switch">
                  <span>Đã có tài khoản? </span>
                  <button type="button" className="switch-btn" onClick={() => setIsLogin(true)}>Đăng nhập</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
