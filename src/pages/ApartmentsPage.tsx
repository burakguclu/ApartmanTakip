import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apartmentService, blockService, flatService } from '@/services/apartmentService';
import type { Apartment, Block, Flat } from '@/types';
import { useModal, useSearch } from '@/hooks/useCommon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apartmentSchema, blockSchema, flatSchema, type ApartmentFormData, type BlockFormData, type FlatFormData } from '@/utils/validations';
import { FLAT_TYPES, OCCUPANCY_STATUSES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/Loading';
import { Plus, Building2, Edit, Trash2, ChevronRight, Home, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApartmentsPage() {
  const { admin } = useAuth();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddFloors, setQuickAddFloors] = useState(5);
  const [quickAddFlatsPerFloor, setQuickAddFlatsPerFloor] = useState(4);
  const [quickAddIsCreating, setQuickAddIsCreating] = useState(false);

  const apartmentModal = useModal();
  const blockModal = useModal();
  const flatModal = useModal();
  const { searchTerm, handleSearch } = useSearch();

  // Apartment Form
  const apartmentForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
  });

  // Block Form
  const blockForm = useForm<BlockFormData>({
    resolver: zodResolver(blockSchema),
  });

  // Flat Form
  const flatForm = useForm<FlatFormData>({
    resolver: zodResolver(flatSchema),
    defaultValues: { type: 'residential', occupancyStatus: 'vacant' },
  });

  const fetchApartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apartmentService.getAll();
      setApartments(data);
    } catch {
      toast.error('Apartmanlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBlocks = useCallback(async (apartmentId: string) => {
    try {
      const data = await blockService.getByApartment(apartmentId);
      setBlocks(data);
    } catch {
      toast.error('Bloklar yüklenemedi');
    }
  }, []);

  const fetchFlats = useCallback(async (blockId: string) => {
    try {
      const data = await flatService.getByBlock(blockId);
      setFlats(data);
    } catch {
      toast.error('Daireler yüklenemedi');
    }
  }, []);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  // Handle apartment select
  const handleSelectApartment = (apt: Apartment) => {
    setSelectedApartment(apt);
    setSelectedBlock(null);
    setFlats([]);
    fetchBlocks(apt.id);
  };

  // Handle block select
  const handleSelectBlock = (block: Block) => {
    setSelectedBlock(block);
    fetchFlats(block.id);
  };

  // APARTMENT CRUD
  const handleSaveApartment = async (data: ApartmentFormData) => {
    if (!admin) return;
    try {
      if (apartmentModal.editingId) {
        const old = apartments.find((a) => a.id === apartmentModal.editingId);
        if (old) await apartmentService.update(apartmentModal.editingId, data, admin.id, old);
        toast.success('Apartman güncellendi');
      } else {
        await apartmentService.create(data, admin.id);
        toast.success('Apartman oluşturuldu');
      }
      apartmentModal.close();
      apartmentForm.reset();
      fetchApartments();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleEditApartment = (apt: Apartment) => {
    apartmentForm.reset({ name: apt.name, address: apt.address, city: apt.city, district: apt.district });
    apartmentModal.openEdit(apt.id);
  };

  // BLOCK CRUD
  const handleSaveBlock = async (data: BlockFormData) => {
    if (!admin || !selectedApartment) return;
    try {
      if (blockModal.editingId) {
        const old = blocks.find((b) => b.id === blockModal.editingId);
        if (old) await blockService.update(blockModal.editingId, data, admin.id, old);
        toast.success('Blok güncellendi');
      } else {
        await blockService.create(selectedApartment.id, data, admin.id);
        toast.success('Blok oluşturuldu');
      }
      blockModal.close();
      blockForm.reset();
      fetchBlocks(selectedApartment.id);
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleEditBlock = (block: Block) => {
    blockForm.reset({ name: block.name, totalFloors: block.totalFloors, totalFlats: block.totalFlats });
    blockModal.openEdit(block.id);
  };

  // FLAT CRUD
  const handleSaveFlat = async (data: FlatFormData) => {
    if (!admin || !selectedApartment || !selectedBlock) return;
    try {
      if (flatModal.editingId) {
        const old = flats.find((f) => f.id === flatModal.editingId);
        if (old) await flatService.update(flatModal.editingId, data as Partial<Flat>, admin.id, old);
        toast.success('Daire güncellendi');
      } else {
        await flatService.create(selectedApartment.id, selectedBlock.id, data, admin.id);
        toast.success('Daire oluşturuldu');
      }
      flatModal.close();
      flatForm.reset();
      fetchFlats(selectedBlock.id);
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleEditFlat = (flat: Flat) => {
    flatForm.reset({
      flatNumber: flat.flatNumber,
      floor: flat.floor,
      type: flat.type,
      occupancyStatus: flat.occupancyStatus,
    });
    flatModal.openEdit(flat.id);
  };

  // DELETE
  const handleDelete = async () => {
    if (!admin || !deleteTarget) return;
    try {
      switch (deleteTarget.type) {
        case 'apartment':
          await apartmentService.delete(deleteTarget.id, admin.id, deleteTarget.name);
          fetchApartments();
          setSelectedApartment(null);
          setBlocks([]);
          setFlats([]);
          break;
        case 'block':
          await blockService.delete(deleteTarget.id, admin.id, deleteTarget.name);
          if (selectedApartment) fetchBlocks(selectedApartment.id);
          setSelectedBlock(null);
          setFlats([]);
          break;
        case 'flat':
          await flatService.delete(deleteTarget.id, admin.id, deleteTarget.name);
          if (selectedBlock) fetchFlats(selectedBlock.id);
          break;
      }
      toast.success('Silindi');
    } catch {
      toast.error('Silme başarısız');
    }
    setDeleteTarget(null);
  };

  // Quick add flats
  const handleQuickAddFlats = async () => {
    if (!admin || !selectedApartment || !selectedBlock) return;
    setQuickAddIsCreating(true);
    try {
      let count = 0;
      for (let floor = 1; floor <= quickAddFloors; floor++) {
        for (let flat = 1; flat <= quickAddFlatsPerFloor; flat++) {
          const flatNumber = String(floor * 100 + flat);
          await flatService.create(
            selectedApartment.id,
            selectedBlock.id,
            {
              flatNumber,
              floor,
              type: 'residential',
              occupancyStatus: 'vacant',
            },
            admin.id
          );
          count++;
        }
      }
      toast.success(`${count} daire oluşturuldu`);
      setQuickAddOpen(false);
      fetchFlats(selectedBlock.id);
    } catch {
      toast.error('Daire oluşturma başarısız');
    } finally {
      setQuickAddIsCreating(false);
    }
  };

  // Filter apartments by search
  const filteredApartments = apartments.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const flatColumns: ColumnDef<Flat>[] = [
    { key: 'flatNumber', title: 'Daire No', render: (f) => <span className="font-medium">{f.flatNumber}</span> },
    { key: 'floor', title: 'Kat', render: (f) => f.floor },
    { key: 'status', title: 'Durum', render: (f) => <Badge status={f.occupancyStatus} /> },
    {
      key: 'actions',
      title: '',
      render: (f) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEditFlat(f); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Edit className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'flat', id: f.id, name: f.flatNumber }); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Trash2 className="h-4 w-4 text-danger-500" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apartman Yönetimi</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>Apartmanlar</span>
            {selectedApartment && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span>{selectedApartment.name}</span>
              </>
            )}
            {selectedBlock && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span>{selectedBlock.name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {selectedBlock && (
            <>
              <Button variant="secondary" onClick={() => { setQuickAddFloors(5); setQuickAddFlatsPerFloor(4); setQuickAddOpen(true); }} leftIcon={<Zap className="h-4 w-4" />}>
                Hızlı Ekle
              </Button>
              <Button onClick={() => { flatForm.reset({ type: 'residential', occupancyStatus: 'vacant', flatNumber: '', floor: 0 }); flatModal.openCreate(); }} leftIcon={<Home className="h-4 w-4" />}>
                Daire Ekle
              </Button>
            </>
          )}
          {selectedApartment && (
            <Button onClick={() => { blockForm.reset(); blockModal.openCreate(); }} variant="secondary" leftIcon={<Building2 className="h-4 w-4" />}>
              Blok Ekle
            </Button>
          )}
          <Button onClick={() => { apartmentForm.reset(); apartmentModal.openCreate(); }} leftIcon={<Plus className="h-4 w-4" />}>
            Apartman Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Apartment List */}
        <div className="lg:col-span-3 space-y-3">
          <Input
            placeholder="Apartman ara..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {filteredApartments.map((apt) => (
            <Card
              key={apt.id}
              className={`cursor-pointer transition-all ${selectedApartment?.id === apt.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}
              padding={false}
            >
              <div className="p-4" onClick={() => handleSelectApartment(apt)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{apt.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{apt.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{apt.city} / {apt.district}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleEditApartment(apt); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Edit className="h-4 w-4 text-gray-400" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'apartment', id: apt.id, name: apt.name }); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Trash2 className="h-4 w-4 text-danger-400" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {filteredApartments.length === 0 && (
            <p className="text-center text-gray-400 py-8">Apartman bulunamadı</p>
          )}
        </div>

        {/* Blocks */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bloklar</h2>
          {selectedApartment ? (
            blocks.length > 0 ? (
              blocks.map((block) => (
                <Card
                  key={block.id}
                  className={`cursor-pointer transition-all ${selectedBlock?.id === block.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}
                  padding={false}
                >
                  <div className="p-4" onClick={() => handleSelectBlock(block)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{block.name}</h3>
                        <p className="text-sm text-gray-500">{block.totalFloors} Kat • {block.totalFlats} Daire</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEditBlock(block); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Edit className="h-4 w-4 text-gray-400" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'block', id: block.id, name: block.name }); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Trash2 className="h-4 w-4 text-danger-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">Henüz blok eklenmemiş</p>
            )
          ) : (
            <p className="text-center text-gray-400 py-8">Apartman seçin</p>
          )}
        </div>

        {/* Flats */}
        <div className="lg:col-span-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Daireler</h2>
          {selectedBlock ? (
            <DataTable
              columns={flatColumns}
              data={flats}
              emptyMessage="Henüz daire eklenmemiş"
            />
          ) : (
            <Card>
              <p className="text-center text-gray-400 py-12">Blok seçin</p>
            </Card>
          )}
        </div>
      </div>

      {/* Apartment Modal */}
      <Modal isOpen={apartmentModal.isOpen} onClose={apartmentModal.close} title={apartmentModal.isEditing ? 'Apartman Düzenle' : 'Apartman Ekle'}>
        <form onSubmit={apartmentForm.handleSubmit(handleSaveApartment)} className="space-y-4">
          <Input label="Apartman Adı" {...apartmentForm.register('name')} error={apartmentForm.formState.errors.name?.message} />
          <Input label="Adres" {...apartmentForm.register('address')} error={apartmentForm.formState.errors.address?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Şehir" {...apartmentForm.register('city')} error={apartmentForm.formState.errors.city?.message} />
            <Input label="İlçe" {...apartmentForm.register('district')} error={apartmentForm.formState.errors.district?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={apartmentModal.close}>İptal</Button>
            <Button type="submit">{apartmentModal.isEditing ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      {/* Block Modal */}
      <Modal isOpen={blockModal.isOpen} onClose={blockModal.close} title={blockModal.isEditing ? 'Blok Düzenle' : 'Blok Ekle'}>
        <form onSubmit={blockForm.handleSubmit(handleSaveBlock)} className="space-y-4">
          <Input label="Blok Adı" {...blockForm.register('name')} error={blockForm.formState.errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Kat Sayısı" type="number" {...blockForm.register('totalFloors', { valueAsNumber: true })} error={blockForm.formState.errors.totalFloors?.message} />
            <Input label="Daire Sayısı" type="number" {...blockForm.register('totalFlats', { valueAsNumber: true })} error={blockForm.formState.errors.totalFlats?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={blockModal.close}>İptal</Button>
            <Button type="submit">{blockModal.isEditing ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      {/* Flat Modal */}
      <Modal isOpen={flatModal.isOpen} onClose={flatModal.close} title={flatModal.isEditing ? 'Daire Düzenle' : 'Daire Ekle'}>
        <form onSubmit={flatForm.handleSubmit(handleSaveFlat)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Daire No" {...flatForm.register('flatNumber')} error={flatForm.formState.errors.flatNumber?.message} />
            <Input label="Kat" type="number" {...flatForm.register('floor', { valueAsNumber: true })} error={flatForm.formState.errors.floor?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tip" options={[...FLAT_TYPES]} {...flatForm.register('type')} error={flatForm.formState.errors.type?.message} />
            <Select label="Durum" options={[...OCCUPANCY_STATUSES]} {...flatForm.register('occupancyStatus')} error={flatForm.formState.errors.occupancyStatus?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={flatModal.close}>İptal</Button>
            <Button type="submit">{flatModal.isEditing ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Flats Modal */}
      <Modal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Hızlı Daire Oluştur">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kat ve daire sayısını belirleyin, daireler otomatik numaralandırılacak.
            <br />
            <span className="text-xs text-gray-400">Örnek: 3. kat, katta 4 daire → 301, 302, 303, 304</span>
          </p>
          <Input
            label="Kat Sayısı"
            type="number"
            min={1}
            max={50}
            value={quickAddFloors}
            onChange={(e) => setQuickAddFloors(Number(e.target.value))}
          />
          <Input
            label="Her Katta Daire Sayısı"
            type="number"
            min={1}
            max={20}
            value={quickAddFlatsPerFloor}
            onChange={(e) => setQuickAddFlatsPerFloor(Number(e.target.value))}
          />
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Toplam:</strong> {quickAddFloors * quickAddFlatsPerFloor} daire</p>
            <p><strong>Numaralama:</strong> 101-{quickAddFloors * 100 + quickAddFlatsPerFloor}</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setQuickAddOpen(false)}>İptal</Button>
            <Button
              onClick={handleQuickAddFlats}
              isLoading={quickAddIsCreating}
              leftIcon={<Zap className="h-4 w-4" />}
            >
              {quickAddFloors * quickAddFlatsPerFloor} Daire Oluştur
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Silme Onayı"
        message={`${deleteTarget?.name} silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?`}
        confirmLabel="Sil"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
