const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendBookingConfirmation = async (bookingData, customerEmail) => {
    try {
        const {
            bookingId,
            customerName,
            homestayName,
            roomTypeName,
            bookingDate,
            checkInDate,
            checkOutDate,
            paymentMethod,
            totalAmount
        } = bookingData;

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        };

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            // CSDL lưu local time nhưng không có timezone, mssql tự động gán là UTC (có chữ Z)
            // nên ta dùng hàm getUTC để lấy đúng giá trị nguyên gốc của local time
            const pad = (n) => n.toString().padStart(2, '0');
            return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} ${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
        };

        const formatDateOnly = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const pad = (n) => n.toString().padStart(2, '0');
            return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
        };

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #1d4ed8; margin: 0;">XÁC NHẬN ĐẶT PHÒNG THÀNH CÔNG</h2>
                <p style="color: #6b7280; margin-top: 5px; font-size: 14px;">Cảm ơn bạn đã lựa chọn Bảo Lộc Stay!</p>
            </div>
            
            <p style="color: #374151; font-size: 16px;">Xin chào <strong>${customerName || customerEmail}</strong>,</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.5;">Đơn đặt phòng của bạn đã được xác nhận và thanh toán thành công. Dưới đây là chi tiết đơn hàng của bạn:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Mã đơn:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold;">#${bookingId}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Khách hàng:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;">${customerName || customerEmail}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Homestay:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;">${homestayName}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Loại phòng:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;">${roomTypeName || 'Phòng tiêu chuẩn'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Ngày đặt:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;">${formatDate(bookingDate)}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Thời gian lưu trú:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;">${formatDateOnly(checkInDate)} đến ${formatDateOnly(checkOutDate)}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Phương thức:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;">${paymentMethod || 'Chuyển khoản VietQR'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Trạng thái:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                        <span style="background-color: #dcfce7; color: #16a34a; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 14px;">Hoàn tất</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 15px 10px; color: #374151; font-weight: bold; font-size: 16px;">Tổng thanh toán:</td>
                    <td style="padding: 15px 10px; color: #1d4ed8; font-weight: bold; font-size: 20px;">${formatCurrency(totalAmount)}</td>
                </tr>
            </table>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-size: 14px; color: #4b5563; text-align: center; margin-top: 20px;">
                <p style="margin: 0;">Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ khách hàng của chúng tôi.</p>
                <p style="margin: 5px 0 0 0;">Chúc bạn có một kỳ nghỉ thật tuyệt vời!</p>
            </div>
        </div>
        `;

        const mailOptions = {
            from: `"Bảo Lộc Stay" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: `Xác nhận đặt phòng thành công - Mã đơn #${bookingId}`,
            html: htmlTemplate
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Xác nhận đơn hàng #${bookingId} đã được gửi tới ${customerEmail}. MessageId: ${info.messageId}`);
    } catch (error) {
        console.error(`[Email Error] Lỗi khi gửi email xác nhận cho đơn hàng #${bookingData?.bookingId}:`, error);
    }
};

const sendOTPEmail = async (email, otp, type) => {
    try {
        const title = type === 'forgot' ? 'KHÔI PHỤC MẬT KHẨU' : 'XÁC NHẬN ĐỔI MẬT KHẨU';
        const message = type === 'forgot' 
            ? 'Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này.' 
            : 'Bạn vừa yêu cầu đổi mật khẩu cho tài khoản của mình.';
            
        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #1d4ed8; margin: 0;">${title}</h2>
            </div>
            
            <p style="color: #374151; font-size: 16px;">Xin chào,</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.5;">${message}</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.5;">Vui lòng sử dụng mã OTP gồm 6 chữ số dưới đây để xác nhận. Mã này sẽ hết hạn trong vòng 5 phút.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f3f4f6; color: #1d4ed8; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 28px; letter-spacing: 4px; display: inline-block; border: 2px dashed #93c5fd;">
                    ${otp}
                </div>
            </div>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; color: #ef4444;">Tuyệt đối KHÔNG chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-size: 14px; color: #4b5563; text-align: center; margin-top: 20px;">
                <p style="margin: 0;">Cảm ơn bạn đã đồng hành cùng Bảo Lộc Stay!</p>
            </div>
        </div>
        `;

        const mailOptions = {
            from: `"Bảo Lộc Stay" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Mã OTP ${title.toLowerCase()} - Bảo Lộc Stay`,
            html: htmlTemplate
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Email OTP đã được gửi tới ${email}. MessageId: ${info.messageId}`);
    } catch (error) {
        console.error(`[Email Error] Lỗi khi gửi email OTP cho ${email}:`, error);
        throw error;
    }
};

module.exports = { sendBookingConfirmation, sendOTPEmail };
