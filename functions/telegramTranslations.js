const telegramTranslations = {
  ru: {
    // Уведомления о новых фиксациях
    newFixationTitle: '🏠 <b>Новая фиксация клиента</b>',
    clientLabel: '👤 <b>Клиент:</b>',
    phoneLabel: '📞 <b>Телефон:</b>',
    agentLabel: '👨‍💼 <b>Агент:</b>',
    complexLabel: '🏘️ <b>Комплекс:</b>',
    developerLabel: '🏗️ <b>Застройщик:</b>',
    propertyTypeLabel: '🏡 <b>Тип недвижимости:</b>',
    timeLabel: '⏰ <b>Время:</b>',
    adminPanelText: '📱 Для обработки фиксации перейдите в админ-панель:',
    adminPanelButton: 'Открыть админ-панель',
    
    // Системные сообщения
    notSpecified: 'Не указан',
    
    // Сообщения подключения
    connectionSuccess: '✅ Подключение успешно завершено!',
    connectionSuccessMessage: 'Теперь вы будете получать уведомления о новых фиксациях клиентов в соответствии с вашей ролью: <b>{role}</b>\n\nВы можете закрыть это окно и вернуться в админ-панель.',
    
    // Сообщения об ошибках
    verificationCodeNotFound: '❌ Код верификации не найден или уже использован.\n\nПолучите новый код в админ-панели в разделе "Настройки".',
    
    // Справочные сообщения
    welcomeMessage: '👋 Добро пожаловать в IT Agent Admin Bot!',
    automaticConnection: '🔗 <b>Автоматическое подключение:</b>',
    automaticConnectionSteps: '1. Перейдите в раздел "Настройки" в админ-панели\n2. Нажмите "Подключить телеграм"\n3. Нажмите кнопку "Подключить через Telegram"\n4. Вы автоматически попадете сюда и подключение завершится',
    manualConnection: '📱 <b>Ручное подключение:</b>',
    manualConnectionInstruction: 'Отправьте команду: <code>/start ВАШ_КОД_ВЕРИФИКАЦИИ</code>',
    finalMessage: 'После подключения вы будете получать уведомления о новых фиксациях клиентов в соответствии с вашей ролью.'
  },
  
  en: {
    // New fixation notifications
    newFixationTitle: '🏠 <b>New Client Fixation</b>',
    clientLabel: '👤 <b>Client:</b>',
    phoneLabel: '📞 <b>Phone:</b>',
    agentLabel: '👨‍💼 <b>Agent:</b>',
    complexLabel: '🏘️ <b>Complex:</b>',
    developerLabel: '🏗️ <b>Developer:</b>',
    propertyTypeLabel: '🏡 <b>Property Type:</b>',
    timeLabel: '⏰ <b>Time:</b>',
    adminPanelText: '📱 To process fixation, go to admin panel:',
    adminPanelButton: 'Open Admin Panel',
    
    // System messages
    notSpecified: 'Not specified',
    
    // Connection messages
    connectionSuccess: '✅ Connection successfully completed!',
    connectionSuccessMessage: 'Now you will receive notifications about new client fixations according to your role: <b>{role}</b>\n\nYou can close this window and return to the admin panel.',
    
    // Error messages
    verificationCodeNotFound: '❌ Verification code not found or already used.\n\nGet a new code in the admin panel in the "Settings" section.',
    
    // Help messages
    welcomeMessage: '👋 Welcome to IT Agent Admin Bot!',
    automaticConnection: '🔗 <b>Automatic connection:</b>',
    automaticConnectionSteps: '1. Go to "Settings" section in admin panel\n2. Click "Connect Telegram"\n3. Click "Connect via Telegram" button\n4. You will automatically be redirected here and connection will be completed',
    manualConnection: '📱 <b>Manual connection:</b>',
    manualConnectionInstruction: 'Send command: <code>/start YOUR_VERIFICATION_CODE</code>',
    finalMessage: 'After connection you will receive notifications about new client fixations according to your role.'
  },
  
  id: {
    // Notifikasi fiksasi baru
    newFixationTitle: '🏠 <b>Fiksasi Klien Baru</b>',
    clientLabel: '👤 <b>Klien:</b>',
    phoneLabel: '📞 <b>Telepon:</b>',
    agentLabel: '👨‍💼 <b>Agen:</b>',
    complexLabel: '🏘️ <b>Kompleks:</b>',
    developerLabel: '🏗️ <b>Pengembang:</b>',
    propertyTypeLabel: '🏡 <b>Jenis Properti:</b>',
    timeLabel: '⏰ <b>Waktu:</b>',
    adminPanelText: '📱 Untuk memproses fiksasi, buka panel admin:',
    adminPanelButton: 'Buka Panel Admin',
    
    // Pesan sistem
    notSpecified: 'Tidak ditentukan',
    
    // Pesan koneksi
    connectionSuccess: '✅ Koneksi berhasil diselesaikan!',
    connectionSuccessMessage: 'Sekarang Anda akan menerima notifikasi tentang fiksasi klien baru sesuai dengan peran Anda: <b>{role}</b>\n\nAnda dapat menutup jendela ini dan kembali ke panel admin.',
    
    // Pesan kesalahan
    verificationCodeNotFound: '❌ Kode verifikasi tidak ditemukan atau sudah digunakan.\n\nDapatkan kode baru di panel admin di bagian "Pengaturan".',
    
    // Pesan bantuan
    welcomeMessage: '👋 Selamat datang di IT Agent Admin Bot!',
    automaticConnection: '🔗 <b>Koneksi otomatis:</b>',
    automaticConnectionSteps: '1. Buka bagian "Pengaturan" di panel admin\n2. Klik "Hubungkan Telegram"\n3. Klik tombol "Hubungkan melalui Telegram"\n4. Anda akan secara otomatis diarahkan ke sini dan koneksi akan selesai',
    manualConnection: '📱 <b>Koneksi manual:</b>',
    manualConnectionInstruction: 'Kirim perintah: <code>/start KODE_VERIFIKASI_ANDA</code>',
    finalMessage: 'Setelah koneksi Anda akan menerima notifikasi tentang fiksasi klien baru sesuai dengan peran Anda.'
  }
};

module.exports = telegramTranslations; 