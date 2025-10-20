document.addEventListener('DOMContentLoaded', () => {
    // --- 🔹 (แนะนำ) เพิ่ม Config ไว้ข้างบนสุดของ app.js 🔹 ---
    const EMAILJS_CONFIG = {
        PUBLIC_KEY: "QWWAWjIdVvqW0oQSn",
        SERVICE_ID: "service_bp7mvo8",
        TEMPLATE_ID_AUTO_REPLY: "YOUR_AUTO_REPLY_TEMPLATE_ID_HERE" // 👈 ใส่ ID จาก Template ใหม่ที่นี่
    };

    // --- Initialize EmailJS ---
    (function(){
        try {
            if (window.emailjs) emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        } catch (e) { console.error("EmailJS SDK not found.", e); }
    })();

    // --- DATA ---
    const clinics = [
        { 
            id: 1, 
            name: "โรงพยาบาลสมิติเวช สุขุมวิท", 
            image: "https://www.samitivejhospitals.com/wp-content/uploads/2022/07/Samitivej-Sukhumvit-Hospital-1.jpg", 
            doctors: [
                { id: 101, name: "นพ. สมชาย ใจดี", specialty: "อายุรศาสตร์", email: "ponahcak@gmail.com" },
                { 
                    id: 102, 
                    name: "พญ. สุภาภรณ์ เก่งมาก", 
                    specialty: "กุมารเวชศาสตร์", 
                    packages: [
                        { id: 1, name: "ตรวจสุขภาพเด็ก", price: 1500, note: "สำหรับเด็กอายุ 1-5 ปี" },
                        { id: 2, name: "ฉีดวัคซีนรวม", price: 2200, note: "รวมวัคซีนพื้นฐาน" }
                    ], 
                    email: "ponahcak@gmail.com"
                }
            ]
        },
        { 
            id: 2, 
            name: "โรงพยาบาลกรุงเทพ", 
            image: "https://www.bangkokhospital.com/storage/page/content/sub-page-widget/bht-building_1666685714.jpg", 
            doctors: [
                { 
                    id: 301, 
                    name: "นพ. ชาญชัย ชนะโรค", 
                    specialty: "อายุรศาสตร์โรคหัวใจ", 
                    packages: [
                        { id: 1, name: "ตรวจคลื่นหัวใจ (EKG)", price: 900, note: "ตรวจการทำงานไฟฟ้าของหัวใจ" },
                        { id: 2, name: "วิ่งสายพาน (EST)", price: 3500, note: "ตรวจสมรรภาพหัวใจขณะออกกำลังกาย" }
                    ], 
                    email: "ponahcak@gmail.com"
                }
            ]
        }
    ];

    let users = JSON.parse(localStorage.getItem('users')) || [];
    let requests = JSON.parse(localStorage.getItem('requests')) || [];

    // --- Core Functions ---

    const registerUser = (name, email, password, idCard) => {
        if (users.find(u => u.email === email)) {
            alert("อีเมลนี้ถูกใช้งานแล้ว");
            return false;
        }
        const newUser = { id: Date.now(), name, email, password, idCard };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        alert("สมัครสมาชิกสำเร็จ!");
        return true;
    };

    const loginUser = (email, password) => {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return false;
    };

    const logout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    };

    const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser'));

    const requireAuth = () => {
        if (!getCurrentUser()) {
            alert("กรุณาเข้าสู่ระบบเพื่อใช้งาน");
            window.location.href = 'index.html';
        }
    };

    const getClinicById = id => clinics.find(c => c.id == id);
    const getDoctorById = (clinicId, doctorId) => {
        const clinic = getClinicById(clinicId);
        return clinic ? clinic.doctors.find(d => d.id == doctorId) : null;
    };

    // 🔹---[REVISED] ฟังก์ชัน createRequest ที่มีการส่งอีเมลตอบกลับอัตโนมัติ---🔹
    const createRequest = requestData => {
        const newRequest = { id: Date.now(), ...requestData, status: "new" };
        
        // ส่งอีเมลตอบกลับอัตโนมัติหาคนไข้ทันที
        emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID_AUTO_REPLY, {
            patient_name: newRequest.patient.name,
            patient_email: newRequest.patient.email,
            doctor_name: newRequest.doctor.name,
            appointment_date: newRequest.date,
            appointment_time: newRequest.time
        }).then(res => {
            console.log("ส่งอีเมล Auto-reply สำเร็จ!", res.status);
        }).catch(err => {
            console.error("ส่งอีเมล Auto-reply ล้มเหลว:", err);
        });
        
        // บันทึกข้อมูลลง localStorage (ทำต่อไปเหมือนเดิม)
        requests.push(newRequest);
        localStorage.setItem('requests', JSON.stringify(requests));
        alert("ส่งคำขอจองนัดเรียบร้อยแล้ว! กรุณาตรวจสอบสถานะที่หน้านัดหมายของฉัน และอีเมลยืนยันการรับเรื่อง");
    };

    const getMyAppointments = () => {
        const currentUser = getCurrentUser();
        return currentUser ? requests.filter(r => r && r.patient && r.patient.id === currentUser.id).sort((a, b) => b.id - a.id) : [];
    };

    // --- Page-Specific Logic ("Router") ---
    const path = window.location.pathname.split("/").pop();

    if (path === 'index.html' || path === '') {
        const loginForm = document.getElementById('login-form');
        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if (loginUser(email, password)) {
                window.location.href = 'home.html';
            }
        });
    }

    if (path === 'register.html') {
        const registerForm = document.getElementById('register-form');
        registerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const idCard = document.getElementById('idCard').value;
            if (registerUser(name, email, password, idCard)) {
                window.location.href = 'index.html';
            }
        });
    }

    if (['home.html', 'clinic.html', 'doctor.html', 'myappointments.html'].includes(path)) {
        requireAuth();
        document.getElementById('logout-btn')?.addEventListener('click', logout);
    }

    if (path === 'home.html') {
        const user = getCurrentUser();
        if (user) {
            document.getElementById('welcome-message').textContent = `สวัสดี, ${user.name}`;
        }
        const clinicList = document.getElementById('clinic-list');
        clinicList.innerHTML = clinics.map(c => `
            <div class="card">
                <img src="${c.image}" style="width:100%; height: 180px; object-fit: cover; border-radius:4px;">
                <h3>${c.name}</h3>
                <button class="btn" onclick="selectClinic(${c.id})">เข้าชมคลินิก</button>
            </div>
        `).join('');
    }
    
    window.selectClinic = id => {
        localStorage.setItem('selectedClinicId', id);
        window.location.href = 'clinic.html';
    };

    if (path === 'clinic.html') {
        const clinicId = localStorage.getItem('selectedClinicId');
        if (!clinicId) {
            window.location.href = 'home.html';
            return;
        }
        const clinic = getClinicById(clinicId);
        document.getElementById('clinic-name').textContent = `รายชื่อแพทย์ใน ${clinic.name}`;
        document.getElementById('doctor-list').innerHTML = clinic.doctors.map(d => `
            <div class="card">
                <h4>${d.name}</h4>
                <p><strong>แผนก:</strong> ${d.specialty}</p>
                <button class="btn" onclick="selectDoctor(${clinic.id}, ${d.id})">จองนัด</button>
            </div>
        `).join('');
    }
    
    window.selectDoctor = (clinicId, doctorId) => {
        localStorage.setItem('selectedClinicId', clinicId);
        localStorage.setItem('selectedDoctorId', doctorId);
        window.location.href = 'doctor.html';
    };

    if (path === 'doctor.html') {
        const clinicId = localStorage.getItem('selectedClinicId');
        const doctorId = localStorage.getItem('selectedDoctorId');
        if (!clinicId || !doctorId) {
            window.location.href = 'home.html';
            return;
        }
        const doctor = getDoctorById(clinicId, doctorId);
        const clinic = getClinicById(clinicId);
        
        document.getElementById('back-to-clinic').href = 'clinic.html';
        document.getElementById('doctor-info').innerHTML = `<h3>${doctor.name}</h3><p>แผนก: ${doctor.specialty}</p><p>โรงพยาบาล: ${clinic.name}</p>`;
        
        const bookingOptionsDiv = document.getElementById('booking-options');
        if (doctor.packages && doctor.packages.length > 0) {
            bookingOptionsDiv.innerHTML = '<h4>เลือกแพ็กเกจ</h4>' + doctor.packages.map(p => `
                <div style="margin-bottom: 0.5rem;">
                    <input type="radio" name="package" id="pkg-${p.id}" value="${p.name}" required> 
                    <label for="pkg-${p.id}">${p.name} - ${p.price} บาท</label><br>
                    <small style="margin-left: 1.5rem;">${p.note}</small>
                </div>
            `).join('');
        } else {
             bookingOptionsDiv.innerHTML = '<input type="hidden" name="package" value="นัดหมายทั่วไป">';
        }

        document.getElementById('booking-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = getCurrentUser();
            const selectedPackage = document.querySelector('input[name="package"]:checked')?.value || "นัดหมายทั่วไป";
            createRequest({
                patient: user,
                clinic: clinic,
                doctor: doctor,
                package: selectedPackage,
                date: document.getElementById('appointment-date').value,
                time: document.getElementById('appointment-time').value,
            });
            window.location.href = 'myappointments.html';
        });
    }

    if (path === 'myappointments.html') {
        const listContainer = document.getElementById('appointments-list');
        const myAppointments = getMyAppointments();
        if (myAppointments.length > 0) {
            listContainer.innerHTML = myAppointments.map(a => {
                if (a.status === 'confirmed') {
                    return `
                        <div class="card appointment-card status-confirmed">
                            <h3>ใบนัดหมาย (ยืนยันแล้ว)</h3>
                            <p><strong>คนไข้:</strong> ${a.patient?.name}</p>
                            <p><strong>แพทย์:</strong> ${a.doctor?.name}</p>
                            <p><strong>คลินิก:</strong> ${a.clinic?.name}</p>
                            <p><strong>วัน-เวลา:</strong> ${a.date} เวลา ${a.time} น.</p>
                            <p><strong>รายละเอียด:</strong> ${a.package || "-"}</p>
                            <hr>
                            <p><em>กรุณามาถึงก่อนเวลานัด 15 นาที</em></p>
                        </div>
                    `;
                }
                else if (a.status === 'rejected') {
                     return `
                        <div class="card appointment-card status-rejected">
                            <h3>ผลการนัดหมาย (ถูกปฏิเสธ)</h3>
                            <p>การนัดหมายของคุณกับ <strong>${a.doctor?.name}</strong> ในวันที่ <strong>${a.date}</strong> ไม่ได้รับการยืนยัน</p>
                            <div class="rejection-reason">
                                <strong>เหตุผลจากแอดมิน:</strong>
                                <p>${a.rejectionReason || "ไม่มีเหตุผลระบุ"}</p>
                            </div>
                        </div>
                    `;
                }
                else {
                     return `
                        <div class="card appointment-card status-pending">
                            <h3>รอดำเนินการ</h3>
                            <p>การนัดหมายของคุณกับ <strong>${a.doctor?.name}</strong> ในวันที่ <strong>${a.date}</strong> กำลังอยู่ระหว่างการตรวจสอบ</p>
                            <p><strong>สถานะปัจจุบัน:</strong> ${a.status === 'new' ? 'เพิ่งส่งคำขอ' : 'แอดมินรับเรื่องแล้ว'}</p>
                        </div>
                    `;
                }
            }).join('');
        } else {
            listContainer.innerHTML = `<p class="text-center">คุณยังไม่มีรายการนัดหมาย</p>`;
        }
    }
});