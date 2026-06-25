const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
const stateInjection = `
  const [showEditHomestayModal, setShowEditHomestayModal] = useState(false);
  const [editingHomestay, setEditingHomestay] = useState(null);

  const [showEditRoomTypeModal, setShowEditRoomTypeModal] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);

  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
`;
if (!content.includes('showEditHomestayModal')) {
    content = content.replace(
        "const [newRoom, setNewRoom] = useState({ room_type_id: '', room_number: '', status: 'available' });",
        "const [newRoom, setNewRoom] = useState({ room_type_id: '', room_number: '', status: 'available' });\n" + stateInjection
    );
}

// 2. Add Handlers (after handleAddRoom)
const handlersInjection = `
  // --- EDIT / DELETE HANDLERS ---
  const handleEditHomestay = (homestay) => {
    setEditingHomestay({ ...homestay });
    setShowEditHomestayModal(true);
  };
  const handleSaveEditHomestay = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');
    try {
      await axios.put(\`http://localhost:5000/api/admin/catalog/hotels/\${editingHomestay.id}\`, editingHomestay, { headers: { Authorization: \`Bearer \${token}\` } });
      showToast('Cập nhật khách sạn thành công', 'success');
      setShowEditHomestayModal(false);
      fetchHomestays();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật khách sạn', 'error');
    }
  };
  const handleDeleteHomestay = async (id) => {
    const confirm = await showConfirm('Xóa Khách sạn', 'Xóa khách sạn này sẽ xóa mọi thứ liên quan. Bạn chắc chứ?');
    if (!confirm.isConfirmed) return;
    const token = sessionStorage.getItem('token');
    try {
      await axios.delete(\`http://localhost:5000/api/admin/catalog/hotels/\${id}\`, { headers: { Authorization: \`Bearer \${token}\` } });
      showToast('Xóa khách sạn thành công', 'success');
      fetchHomestays();
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
      await axios.put(\`http://localhost:5000/api/admin/catalog/room-types/\${editingRoomType.id}\`, editingRoomType, { headers: { Authorization: \`Bearer \${token}\` } });
      showToast('Cập nhật loại phòng thành công', 'success');
      setShowEditRoomTypeModal(false);
      fetchRoomTypes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật loại phòng', 'error');
    }
  };
  const handleDeleteRoomType = async (id) => {
    const confirm = await showConfirm('Xóa Loại phòng', 'Không thể xóa nếu loại phòng này đang có phòng vật lý. Tiếp tục?');
    if (!confirm.isConfirmed) return;
    const token = sessionStorage.getItem('token');
    try {
      await axios.delete(\`http://localhost:5000/api/admin/catalog/room-types/\${id}\`, { headers: { Authorization: \`Bearer \${token}\` } });
      showToast('Xóa loại phòng thành công', 'success');
      fetchRoomTypes();
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
      await axios.put(\`http://localhost:5000/api/admin/catalog/rooms/\${editingRoom.id}\`, editingRoom, { headers: { Authorization: \`Bearer \${token}\` } });
      showToast('Cập nhật phòng thành công', 'success');
      setShowEditRoomModal(false);
      fetchRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật phòng', 'error');
    }
  };
  const handleDeleteRoom = async (id) => {
    const confirm = await showConfirm('Xóa Phòng', 'Không thể xóa nếu phòng đang có người đặt. Bạn chắc chứ?');
    if (!confirm.isConfirmed) return;
    const token = sessionStorage.getItem('token');
    try {
      await axios.delete(\`http://localhost:5000/api/admin/catalog/rooms/\${id}\`, { headers: { Authorization: \`Bearer \${token}\` } });
      showToast('Xóa phòng thành công', 'success');
      fetchRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa phòng', 'error');
    }
  };
`;
if (!content.includes('handleEditHomestay')) {
    content = content.replace(
        "const handleAddRoom = async (e) => {",
        handlersInjection + "\n  const handleAddRoom = async (e) => {"
    );
}

// 3. Update Buttons in the tables
// Homestays
content = content.replace(
    /<button className="btn btn-outline btn-sm action-btn" onClick=\{\(\) => showToast\('Chức năng đang phát triển', 'info'\)\}>Sửa<\/button>/g,
    `<button className="btn btn-outline btn-sm action-btn" onClick={() => handleEditHomestay(h)}>Sửa</button>`
);
content = content.replace(
    /<button className="btn btn-danger btn-sm action-btn" style=\{\{ marginLeft: '8px' \}\} onClick=\{\(\) => showToast\('Chức năng đang phát triển', 'info'\)\}>Xóa<\/button>/g,
    `<button className="btn btn-danger btn-sm action-btn" style={{ marginLeft: '8px' }} onClick={() => handleDeleteHomestay(h.id)}>Xóa</button>`
);

// RoomTypes
content = content.replace(
    /<button className="btn btn-outline btn-sm action-btn">Sửa<\/button>\s*<button className="btn btn-danger btn-sm action-btn" style=\{\{ marginLeft: '4px' \}\}>Xóa<\/button>/g,
    `<button className="btn btn-outline btn-sm action-btn" onClick={() => handleEditRoomType(rt)}>Sửa</button>
                              <button className="btn btn-danger btn-sm action-btn" style={{ marginLeft: '4px' }} onClick={() => handleDeleteRoomType(rt.id)}>Xóa</button>`
);

// Rooms
content = content.replace(
    /<button className="btn btn-outline btn-sm action-btn">Sửa<\/button>\s*<button className="btn btn-danger btn-sm action-btn" style=\{\{ marginLeft: '4px' \}\}>Xóa<\/button>/g,
    `<button className="btn btn-outline btn-sm action-btn" onClick={() => handleEditRoom(r)}>Sửa</button>
                              <button className="btn btn-danger btn-sm action-btn" style={{ marginLeft: '4px' }} onClick={() => handleDeleteRoom(r.id)}>Xóa</button>`
);

// 4. Modals
const modalsInjection = `
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
                <input type="text" required value={editingHomestay.name} onChange={(e) => setEditingHomestay({...editingHomestay, name: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea rows="3" value={editingHomestay.description} onChange={(e) => setEditingHomestay({...editingHomestay, description: e.target.value})} className="form-control"></textarea>
              </div>
              <div className="form-group">
                <label>Tiện ích (cách nhau bởi dấu phẩy)</label>
                <input type="text" value={editingHomestay.facilities_text} onChange={(e) => setEditingHomestay({...editingHomestay, facilities_text: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input type="text" value={editingHomestay.address} onChange={(e) => setEditingHomestay({...editingHomestay, address: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={editingHomestay.status} onChange={(e) => setEditingHomestay({...editingHomestay, status: e.target.value})} className="form-control">
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
                <input type="text" required value={editingRoomType.name} onChange={(e) => setEditingRoomType({...editingRoomType, name: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Giá cơ bản</label>
                <input type="number" required value={editingRoomType.base_price} onChange={(e) => setEditingRoomType({...editingRoomType, base_price: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Sức chứa (người lớn)</label>
                <input type="number" required value={editingRoomType.capacity} onChange={(e) => setEditingRoomType({...editingRoomType, capacity: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Tiện ích trong phòng</label>
                <input type="text" value={editingRoomType.room_amenities_text} onChange={(e) => setEditingRoomType({...editingRoomType, room_amenities_text: e.target.value})} className="form-control" />
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
                <input type="text" required value={editingRoom.room_number} onChange={(e) => setEditingRoom({...editingRoom, room_number: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={editingRoom.status} onChange={(e) => setEditingRoom({...editingRoom, status: e.target.value})} className="form-control">
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
`;

if (!content.includes('EDIT HOMESTAY MODAL')) {
    content = content.replace(
        "    </div>\n  );\n};\n\nexport default AdminDashboard;",
        modalsInjection + "\n    </div>\n  );\n};\n\nexport default AdminDashboard;"
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminDashboard.jsx updated successfully!');
