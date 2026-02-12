# ApartmanTakip - Apartman Yönetim Sistemi

Apartman aidatları, sakinler, ödemeler, giderler ve finansal raporlama için kapsamlı bir yönetim paneli.

## Özellikler

### Temel Modüller

- **Dashboard** - Finansal özet, grafikler, gecikmiş aidatlar
- **Apartman Yönetimi** - Apartman, blok ve daire CRUD
- **Sakin Yönetimi** - Sakin kayıt, taşınma, TC/telefon doğrulama
- **Aidat Yönetimi** - Toplu aidat oluşturma, gecikme faizi, ödeme takip
- **Ödeme Yönetimi** - Ödeme kayıt, makbuz PDF, banka referans
- **Gider Yönetimi** - Kategori bazlı giderler, onay/red akışı, tekrarlayan giderler
- **Raporlar** - Aylık gelir/gider, kümülatif bakiye, gider dağılımı, tahsilat oranı
- **Dışa Aktarım** - Excel ve PDF rapor indirme
- **İşlem Kayıtları** - Tüm CRUD işlemlerinin audit log kaydı
- **Bildirimler** - Gecikme uyarıları, ödeme bildirimleri
- **Ayarlar** - Kullanıcı profili, tema tercihi

### Teknik Özellikler

- React 18+ / TypeScript (Strict mode)
- Firebase Authentication & Firestore
- TailwindCSS v4 (Dark mode)
- React Router v7 lazy loading / code splitting
- Zod form validation + React Hook Form
- Recharts grafikleri
- xlsx / jsPDF Excel & PDF export
- Responsive tasarım
- Error Boundary, Loading Skeletons
- Audit log (eski/yeni değer karşılaştırma)

## Kurulum

### Gereksinimler

- Node.js 18+
- Firebase projesi

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Firebase Yapılandırması

`.env` dosyası oluşturun (`.env.example` şablonuna bakın):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Firebase Admin Kullanıcı Oluşturma

Firestore Console'da `admins` koleksiyonuna bir döküman ekleyin:

```json
{
  "email": "admin@example.com",
  "displayName": "Admin",
  "role": "admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Döküman ID'si = Firebase Auth'daki kullanıcı UID olmalıdır.

### 4. Geliştirme Sunucusu

```bash
npm run dev
```

http://localhost:3000 adresinde açılır.

### 5. Production Build

```bash
npm run build
```

### 6. Firebase Deploy

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Proje Yapısı

```
src/
├── App.tsx                  # React Router yapılandırması
├── main.tsx                 # Entry point
├── index.css                # TailwindCSS + tema
├── config/
│   └── firebase.ts          # Firebase başlatma
├── types/
│   └── index.ts             # TypeScript arayüzleri
├── utils/
│   ├── helpers.ts           # Yardımcı fonksiyonlar
│   ├── constants.ts         # Sabitler
│   └── validations.ts       # Zod şemaları
├── services/
│   ├── authService.ts       # Auth işlemleri
│   ├── firestoreService.ts  # Generic CRUD
│   ├── apartmentService.ts  # Apartman/Blok/Daire
│   ├── residentService.ts   # Sakin
│   ├── dueService.ts        # Aidat
│   ├── paymentService.ts    # Ödeme
│   ├── expenseService.ts    # Gider
│   ├── auditLogService.ts   # İşlem kayıtları
│   ├── notificationService.ts # Bildirimler
│   ├── exportService.ts     # Excel export
│   └── pdfService.ts        # PDF export
├── contexts/
│   ├── AuthContext.tsx       # Auth state
│   └── ThemeContext.tsx      # Tema state
├── hooks/
│   └── useCommon.ts         # Custom hooks
├── components/
│   ├── ui/                  # Reusable components
│   ├── layout/              # Sidebar, Header, MainLayout
│   └── auth/                # ProtectedRoute
└── pages/
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── ApartmentsPage.tsx
    ├── ResidentsPage.tsx
    ├── DuesPage.tsx
    ├── PaymentsPage.tsx
    ├── ExpensesPage.tsx
    ├── ReportsPage.tsx
    ├── ExportsPage.tsx
    ├── AuditLogsPage.tsx
    ├── NotificationsPage.tsx
    └── SettingsPage.tsx
```

## Güvenlik

- Tüm rotalar `ProtectedRoute` ile korumalı
- Firestore Security Rules ile backend koruması
- Admin kullanıcı doğrulama (Auth + Firestore `admins` koleksiyonu)
- Soft delete pattern (veriler kalıcı silinmez)
- Audit log ile tam izlenebilirlik

## Lisans

MIT
