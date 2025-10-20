document.addEventListener('DOMContentLoaded', () => {
    // --- ตั้งค่า ID ทั้งหมดของคุณที่นี่ ---
    const EMAILJS_CONFIG = {
        PUBLIC_KEY: "QWWAWjIdVvqW0oQSn",
        SERVICE_ID: "service_bp7mvo8",
        TEMPLATE_ID_NOTIFY_DOCTOR: "template_gaj3ou5" // 👈 ใส่ ID สำหรับ "แจ้งหมอ"
    };

    const ADMIN_CONFIG = {
        name: "แอดมิน Health Queue",
        email: "peace@gmail.com" // 👈 ใส่อีเมลแอดมินของคุณที่นี่
    };

    (function(){
      try { if (window.emailjs) emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY); } 
      catch (e) { console.error("EmailJS SDK not found.", e); }
    })();

    let requests = JSON.parse(localStorage.getItem('requests')) || [];
    const newListDiv = document.getElementById('new-requests-list');
    const approvedListDiv = document.getElementById('approved-requests-list');

    // 🔹---[ฟังก์ชันใหม่]---🔹
    window.rejectSpam = (id) => {
        if (confirm('คุณต้องการลบคำขอนี้ออกจากระบบ (สแปม) ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            const index = requests.findIndex(r => r.id === id);
            if (index > -1) {
                requests.splice(index, 1);
                localStorage.setItem('requests', JSON.stringify(requests));
                render();
                alert('ลบรายการสแปมเรียบร้อยแล้ว');
            }
        }
    };

    function render() {
        const newRequests = requests.filter(r => r && r.status === 'new');
        const approvedRequests = requests.filter(r => r && r.status === 'approved');
        
        // 🔹---[แก้ไขส่วนนี้]---🔹
        newListDiv.innerHTML = newRequests.length === 0 ? '<p class="text-center">ไม่มีรายการนัดหมายใหม่</p>' :
            newRequests.map(r => `
                <div class="card admin-appointment-item">
                    <p><strong>คนไข้:</strong> ${r.patient?.name || 'N/A'} | <strong>แพทย์:</strong> ${r.doctor?.name || 'N/A'}</p>
                    <p><strong>วัน-เวลา:</strong> ${r.date || '-'} ${r.time || ''}</p>
                    <div class="admin-actions">
                        <button class="btn" onclick="sendToDoctorAndMove(${r.id}, this)">ส่งอีเมลแจ้งหมอ &raquo;</button>
                        <button class="btn btn-danger" onclick="rejectSpam(${r.id})">ปฏิเสธ (สแปม)</button>
                    </div>
                </div>
            `).join('');
        
        approvedListDiv.innerHTML = approvedRequests.length === 0 ? '<p class="text-center">ไม่มีรายการรอแจ้งผล</p>' :
            approvedRequests.map(r => `
                <div class="card admin-appointment-item" id="request-card-${r.id}">
                    <p><strong>คนไข้:</strong> ${r.patient?.name || 'N/A'} | <strong>แพทย์:</strong> ${r.doctor?.name || 'N/A'}</p>
                    <p><strong>วัน-เวลา:</strong> ${r.date || '-'} ${r.time || ''}</p>
                    <hr>
                    <div class="admin-actions" style="flex-wrap: wrap;">
                        <div style="flex-basis: 100%; margin-bottom: 1rem;">
                            <button class="btn btn-success" onclick="confirmAppointment(${r.id}, this)">ยืนยันนัดหมาย</button>
                        </div>
                        <div style="flex-basis: 100%;">
                            <textarea id="rejection-msg-${r.id}" class="input" placeholder="ปฏิเสธพร้อมเขียนคำแนะนำ/เหตุผล"></textarea>
                            <button class="btn btn-danger" style="margin-top: 0.5rem;" onclick="rejectAppointment(${r.id}, this)">ปฏิเสธนัดหมาย</button>
                        </div>
                    </div>
                </div>
            `).join('');

        document.getElementById('new-count').textContent = newRequests.length || '';
        document.getElementById('approved-count').textContent = approvedRequests.length || '';
    }
    
    function updateRequestStatus(id, newStatus, extraData = {}) {
        const idx = requests.findIndex(r => r.id === id);
        if (idx !== -1) {
            requests[idx].status = newStatus;
            Object.assign(requests[idx], extraData);
            localStorage.setItem('requests', JSON.stringify(requests));
            render();
        }
    }

    window.sendToDoctorAndMove = (id, btn) => {
        const request = requests.find(r => r.id === id);
        if (!request || !request.patient || !request.doctor) { alert('ข้อมูลไม่สมบูรณ์'); return; }
        btn.disabled = true; btn.textContent = 'กำลังส่ง...';
        emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID_NOTIFY_DOCTOR, {
            email: request.doctor.email, name: "แอดมิน Health Queue", doctor_name: request.doctor.name,
            patient_name: request.patient.name, appointment_date: request.date, appointment_time: request.time,
            hospital_name: request.clinic.name
        }).then(() => {
            alert('ส่งอีเมลแจ้งหมอเรียบร้อยแล้ว');
            updateRequestStatus(id, 'approved');
        }).catch(err => {
            alert('ส่งอีเมลแจ้งหมอล้มเหลว!'); console.error(err); btn.disabled = false;
        });
    };
    
    window.confirmAppointment = (id, btn) => {
        if (confirm('คุณต้องการยืนยันนัดหมายนี้หรือไม่?')) {
            updateRequestStatus(id, 'confirmed');
            alert('ยืนยันนัดหมายเรียบร้อยแล้ว สถานะจะถูกอัปเดตที่หน้าของคนไข้');
        }
    };
    
    window.rejectAppointment = (id, btn) => {
        const message = document.getElementById(`rejection-msg-${id}`).value.trim();
        if (!message) { alert('กรุณาพิมพ์เหตุผลในการปฏิเสธ'); return; }
        if (confirm('คุณต้องการปฏิเสธนัดหมายนี้ใช่หรือไม่?')) {
            updateRequestStatus(id, 'rejected', { rejectionReason: message });
            alert('ปฏิเสธนัดหมายเรียบร้อยแล้ว สถานะจะถูกอัปเดตที่หน้าของคนไข้');
        }
    };

    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('#admin-nav .btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;
            pages.forEach(p => p.classList.toggle('active', p.id === pageId));
            navButtons.forEach(b => {
                b.classList.remove('active', 'btn-secondary');
                if (b.dataset.page === pageId) b.classList.add('active');
                else b.classList.add('btn-secondary');
            });
        });
    });

    render();
});