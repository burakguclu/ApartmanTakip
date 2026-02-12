import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { residentService } from '@/services/residentService';
import { apartmentService, blockService, flatService } from '@/services/apartmentService';
import type { Resident, Apartment, Block, Flat } from '@/types';
import { useModal, useSearch } from '@/hooks/useCommon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { residentSchema, type ResidentFormData } from '@/utils/validations';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/Loading';
import { UserPlus, Edit, Trash2, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/helpers';

export default function ResidentsPage() {
  const { admin } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const modal = useModal();
  const { searchTerm, handleSearch } = useSearch();

  const form = useForm<ResidentFormData>({
    resolver: zodResolver(residentSchema),
    defaultValues: { type: 'tenant', notes: '', secondaryPhone: '', emergencyContact: '', emergencyPhone: '', moveOutDate: '' },
  });

  const selectedApartmentId = form.watch('apartmentId');
  const selectedBlockId = form.watch('blockId');

  const fetchResidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await residentService.getAll();
      setResidents(data);
    } catch {
      toast.error('Sakinler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchApartments = useCallback(async () => {
    const data = await apartmentService.getAll();
    setApartments(data);
  }, []);

  useEffect(() => {
    fetchResidents();
    fetchApartments();
  }, [fetchResidents, fetchApartments]);

  useEffect(() => {
    if (selectedApartmentId) {
      blockService.getByApartment(selectedApartmentId).then(setBlocks);
    }
  }, [selectedApartmentId]);

  useEffect(() => {
    if (selectedBlockId) {
      flatService.getByBlock(selectedBlockId).then(setFlats);
    }
  }, [selectedBlockId]);

  const handleSave = async (data: ResidentFormData) => {
    if (!admin) return;
    try {
      if (modal.editingId) {
        const old = residents.find((r) => r.id === modal.editingId);
        if (old) await residentService.update(modal.editingId, data, admin.id, old);
        toast.success('Sakin güncellendi');
      } else {
        await residentService.create(data, admin.id);
        toast.success('Sakin eklendi');
      }
      modal.close();
      form.reset();
      fetchResidents();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleEdit = (resident: Resident) => {
    form.reset({
      firstName: resident.firstName,
      lastName: resident.lastName,
      email: resident.email,
      phone: resident.phone,
      secondaryPhone: resident.secondaryPhone || '',
      emergencyContact: resident.emergencyContact || '',
      emergencyPhone: resident.emergencyPhone || '',
      tcNo: resident.tcNo,
      type: resident.type,
      flatId: resident.flatId,
      blockId: resident.blockId,
      apartmentId: resident.apartmentId,
      moveInDate: resident.moveInDate,
      moveOutDate: resident.moveOutDate || '',
      notes: resident.notes || '',
    });
    modal.openEdit(resident.id);
  };

  const handleDelete = async () => {
    if (!admin || !deleteId) return;
    const resident = residents.find((r) => r.id === deleteId);
    if (resident) {
      try {
        await residentService.delete(deleteId, admin.id, `${resident.firstName} ${resident.lastName}`);
        toast.success('Sakin silindi');
        fetchResidents();
      } catch {
        toast.error('Silme başarısız');
      }
    }
    setDeleteId(null);
  };

  const filtered = residents.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.firstName.toLowerCase().includes(term) ||
      r.lastName.toLowerCase().includes(term) ||
      r.phone.includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.tcNo.includes(term)
    );
  });

  const columns: ColumnDef<Resident>[] = [
    {
      key: 'name',
      title: 'Ad Soyad',
      render: (r) => (
        <div>
          <span className="font-medium">{r.firstName} {r.lastName}</span>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>
            {r.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>}
          </div>
        </div>
      ),
    },
    { key: 'tc', title: 'TC No', render: (r) => r.tcNo },
    { key: 'type', title: 'Tip', render: (r) => <Badge status={r.type} /> },
    { key: 'moveIn', title: 'Giriş Tarihi', render: (r) => formatDate(r.moveInDate) },
    { key: 'status', title: 'Durum', render: (r) => <Badge status={r.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      title: '',
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => handleEdit(r)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Edit className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={() => setDeleteId(r.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Trash2 className="h-4 w-4 text-danger-500" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sakin Yönetimi</h1>
        <Button onClick={() => { form.reset(); modal.openCreate(); }} leftIcon={<UserPlus className="h-4 w-4" />}>
          Sakin Ekle
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Ad, soyad, TC, telefon ile ara..."
        emptyMessage="Sakin bulunamadı"
      />

      {/* Modal */}
      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.isEditing ? 'Sakin Düzenle' : 'Sakin Ekle'} size="lg">
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ad" {...form.register('firstName')} error={form.formState.errors.firstName?.message} />
            <Input label="Soyad" {...form.register('lastName')} error={form.formState.errors.lastName?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="TC Kimlik No" {...form.register('tcNo')} error={form.formState.errors.tcNo?.message} />
            <Select label="Tip" options={[{ value: 'owner', label: 'Mal Sahibi' }, { value: 'tenant', label: 'Kiracı' }]} {...form.register('type')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefon" {...form.register('phone')} error={form.formState.errors.phone?.message} />
            <Input label="E-posta" {...form.register('email')} error={form.formState.errors.email?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="İkinci Telefon" {...form.register('secondaryPhone')} />
            <Input label="Acil Durum Kişisi" {...form.register('emergencyContact')} />
          </div>
          <Input label="Acil Durum Telefon" {...form.register('emergencyPhone')} />

          <div className="grid grid-cols-3 gap-4">
            <Select label="Apartman" options={apartments.map((a) => ({ value: a.id, label: a.name }))} placeholder="Seçin" {...form.register('apartmentId')} error={form.formState.errors.apartmentId?.message} />
            <Select label="Blok" options={blocks.map((b) => ({ value: b.id, label: b.name }))} placeholder="Seçin" {...form.register('blockId')} error={form.formState.errors.blockId?.message} />
            <Select label="Daire" options={flats.map((f) => ({ value: f.id, label: f.flatNumber }))} placeholder="Seçin" {...form.register('flatId')} error={form.formState.errors.flatId?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Giriş Tarihi" type="date" {...form.register('moveInDate')} error={form.formState.errors.moveInDate?.message} />
            <Input label="Çıkış Tarihi" type="date" {...form.register('moveOutDate')} />
          </div>

          <Input label="Notlar" {...form.register('notes')} />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={modal.close}>İptal</Button>
            <Button type="submit">{modal.isEditing ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Silme Onayı"
        message="Bu sakin silinecek. Onaylıyor musunuz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
