import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Sun, Moon, Shield, User, Mail, Clock, RotateCcw, Database } from 'lucide-react';
import { formatDateTime } from '@/utils/helpers';
import { factoryReset, generateTestData } from '@/services/seedService';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { admin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [resetConfirm, setResetConfirm] = useState(false);
  const [seedConfirm, setSeedConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleFactoryReset = async () => {
    setResetConfirm(false);
    setIsResetting(true);
    try {
      const count = await factoryReset();
      toast.success(`Fabrika ayarlarına dönüldü. ${count} kayıt silindi.`);
    } catch {
      toast.error('Sıfırlama başarısız');
    } finally {
      setIsResetting(false);
    }
  };

  const handleGenerateTestData = async () => {
    setSeedConfirm(false);
    if (!admin) return;
    setIsSeeding(true);
    try {
      const result = await generateTestData(admin.id);
      toast.success(
        `Test verisi oluşturuldu: ${result.apartments} apartman, ${result.blocks} blok, ${result.flats} daire, ${result.residents} sakin`
      );
    } catch {
      toast.error('Test verisi oluşturulamadı');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>

      {/* Profile */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil Bilgileri</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{admin?.displayName}</p>
              <p className="text-sm text-gray-500">{admin?.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">E-posta</p>
                <p className="font-medium text-gray-900 dark:text-white">{admin?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Rol</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{admin?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Son Giriş</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {admin?.lastLogin ? formatDateTime(admin.lastLogin) : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Görünüm</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="h-5 w-5 text-primary-400" /> : <Sun className="h-5 w-5 text-yellow-500" />}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {isDark ? 'Koyu Mod' : 'Açık Mod'}
              </p>
              <p className="text-sm text-gray-500">Tema tercihini değiştir</p>
            </div>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            {isDark ? 'Açık Mod' : 'Koyu Mod'}
          </Button>
        </div>
      </Card>

      {/* System Info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sistem Bilgisi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Uygulama</p>
            <p className="font-medium text-gray-900 dark:text-white">ApartmanTakip v1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Platform</p>
            <p className="font-medium text-gray-900 dark:text-white">Firebase + React</p>
          </div>
          <div>
            <p className="text-gray-500">Ortam</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {import.meta.env.MODE === 'production' ? 'Üretim' : 'Geliştirme'}
            </p>
          </div>
        </div>
      </Card>

      {/* Database Operations */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Veritabanı İşlemleri</h2>
        <div className="space-y-4">
          {/* Test Data */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <Database className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Test Verisi Oluştur</p>
                <p className="text-sm text-gray-500">
                  2 apartman, 4 blok, 20 daire ve 20 sakin ekler
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setSeedConfirm(true)}
              isLoading={isSeeding}
              leftIcon={<Database className="h-4 w-4" />}
            >
              Oluştur
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Factory Reset */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                <RotateCcw className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Fabrika Ayarlarına Dön</p>
                <p className="text-sm text-gray-500">
                  Tüm verileri siler (admin hesabı hariç). Bu işlem geri alınamaz!
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => setResetConfirm(true)}
              isLoading={isResetting}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Sıfırla
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={resetConfirm}
        title="Fabrika Ayarlarına Dön"
        message="TÜM VERİLER SİLİNECEK! Apartmanlar, bloklar, daireler, sakinler, aidatlar, giderler, gelirler — hepsi yok olacak. Admin hesabınız korunacak. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?"
        confirmLabel="Evet, Sıfırla"
        onConfirm={handleFactoryReset}
        onCancel={() => setResetConfirm(false)}
      />
      <ConfirmDialog
        isOpen={seedConfirm}
        title="Test Verisi Oluştur"
        message="2 apartman, 4 blok, 20 daire ve 20 sakin içeren test verisi oluşturulacak. Mevcut verilerin üzerine eklenir. Devam etmek istiyor musunuz?"
        confirmLabel="Evet, Oluştur"
        onConfirm={handleGenerateTestData}
        onCancel={() => setSeedConfirm(false)}
      />
    </div>
  );
}
