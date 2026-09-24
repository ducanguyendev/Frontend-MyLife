import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  LayoutGrid, 
  List as ListIcon, 
  Search, 
  Calendar, 
  MapPin, 
  Heart, 
  User, 
  Plus,
  X,
  BookOpen,
  Edit3,
  Save,
  MoreVertical,
  Eye,
  Trash2,
  ArrowUpDown,
  FolderTree,
  Globe,
  Phone
} from 'lucide-react';

import { AncestorMemorial } from '../components/family/AncestorMemorial';
import { FamilyLibrary } from '../components/family/FamilyLibrary';
import { FamilyMapStats } from '../components/family/FamilyMapStats';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FamilyMember {
  id: string;
  name: string;
  generation: number; // 1 đến 10
  role: string;
  birthYear: string; // Định dạng YYYY-MM-DD
  deathYear?: string;
  lunarDeathDate?: string;
  gender: 'male' | 'female';
  spouse?: string;
  address: string;
  avatar: string;
  bio: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  fatherId?: string;
  motherId?: string;
  childrenIds?: string[];
}

const initialFamilyMembers: FamilyMember[] = [
  // --- ĐỜI 1: ÔNG BÀ ---
  {
    id: '1',
    name: 'Nguyễn Văn Đạo',
    generation: 1,
    role: 'Thủy tổ (Ông nội)',
    birthYear: '1920-05-12',
    deathYear: '1995',
    gender: 'male',
    spouse: 'Trần Thị Mai',
    address: 'Nam Định',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    bio: 'Cụ ông khai hoang lập nghiệp dòng họ Nguyễn.',
    phone: '0901234567',
    childrenIds: ['2', '3'] // Cha và Cô/Út
  },
  {
    id: '1.2',
    name: 'Trần Thị Mai',
    generation: 1,
    role: 'Bà nội',
    birthYear: '1924-09-10',
    deathYear: '2005',
    gender: 'female',
    spouse: 'Nguyễn Văn Đạo',
    address: 'Nam Định',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200',
    bio: 'Cụ bà tần tảo nuôi dạy con cháu.',
    childrenIds: ['2', '3']
  },

  // --- ĐỜI 2: CHA MẸ, CÔ/CHÚ/DÌ ---
  {
    id: '2',
    name: 'Nguyễn Văn Hùng',
    generation: 2,
    role: 'Trưởng nam (Cha)',
    birthYear: '1950-08-20',
    gender: 'male',
    spouse: 'Lê Thị Hoa',
    address: 'Hà Nội',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    bio: 'Cựu giáo viên toán, cha của Tuấn và Hà.',
    fatherId: '1',
    motherId: '1.2',
    phone: '0912345678',
    childrenIds: ['4', '5'] // Anh em ruột
  },
  {
    id: '2.1',
    name: 'Lê Thị Hoa',
    generation: 2,
    role: 'Mẹ',
    birthYear: '1953-02-14',
    gender: 'female',
    spouse: 'Nguyễn Văn Hùng',
    address: 'Hà Nội',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    bio: 'Mẹ hiền chăm lo gia đình.',
    childrenIds: ['4', '5']
  },
  {
    id: '3',
    name: 'Nguyễn Thị Lan',
    generation: 2,
    role: 'Cô ruột (Em gái ông Hùng)',
    birthYear: '1955-03-15',
    gender: 'female',
    spouse: 'Phạm Văn Minh',
    address: 'Hải Phòng',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    bio: 'Doanh nhân thành đạt, cô ruột của con cháu.',
    fatherId: '1',
    motherId: '1.2',
    childrenIds: ['6'] // Sinh ra anh em họ (C)
  },

  // --- ĐỜI 3: ANH EM RUỘT, ANH EM HỌ, VỢ CHỒNG ---
  {
    id: '4',
    name: 'Nguyễn Minh Tuấn',
    generation: 3,
    role: 'Trưởng nam (Tôi)',
    birthYear: '1982-11-05',
    gender: 'male',
    spouse: 'Hoàng Thùy Linh',
    address: 'TP. Hồ Chí Minh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    bio: 'Kỹ sư phần mềm, quản lý hệ thống gia phả.',
    fatherId: '2',
    motherId: '2.1',
    phone: '0988776655',
    facebook: 'tuan.nguyenminh',
    childrenIds: ['7'] // Sinh ra con cháu đời 4
  },
  {
    id: '4.1',
    name: 'Hoàng Thùy Linh',
    generation: 3,
    role: 'Vợ',
    birthYear: '1985-12-10',
    gender: 'female',
    spouse: 'Nguyễn Minh Tuấn',
    address: 'TP. Hồ Chí Minh',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    bio: 'Giảng viên đại học.',
    childrenIds: ['7']
  },
  {
    id: '5',
    name: 'Nguyễn Thanh Hà',
    generation: 3,
    role: 'Em gái ruột (của Tuấn)',
    birthYear: '1988-07-22',
    gender: 'female',
    address: 'Đà Nẵng',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    bio: 'Bác sĩ bệnh viện đa khoa trung ương. Là em ruột sống cùng cha mẹ Hùng - Hoa.',
    fatherId: '2',
    motherId: '2.1'
  },
  {
    id: '6',
    name: 'Phạm Văn Nam',
    generation: 3,
    role: 'Anh em họ (Con của cô Lan)',
    birthYear: '1980-04-12',
    gender: 'male',
    address: 'Hải Phòng',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    bio: 'Là con của cô ruột Nguyễn Thị Lan, gọi Tuấn và Hà bằng anh em họ.',
    motherId: '3'
  },

  // --- ĐỜI 4: CON CHÁU ---
  {
    id: '7',
    name: 'Nguyễn Gia Bảo',
    generation: 4,
    role: 'Con trai đích tôn (Đời 4)',
    birthYear: '2010-06-01',
    gender: 'male',
    address: 'TP. Hồ Chí Minh',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    bio: 'Học sinh giỏi cấp thành phố, con trai của Tuấn và Linh.',
    fatherId: '4',
    motherId: '4.1'
  }
];

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const FamilyTree: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'members' | 'memorial' | 'library' | 'map'>('members');
  const [members, setMembers] = useState<FamilyMember[]>(initialFamilyMembers);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  const [activeMember, setActiveMember] = useState<FamilyMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<FamilyMember | null>(null);

  const [isRelationOpen, setIsRelationOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenModal = (member: FamilyMember, editMode = false) => {
    setActiveMember(member);
    setEditForm({ ...member, childrenIds: member.childrenIds || [] });
    setIsEditing(editMode);
    setIsRelationOpen(false);
    setIsContactOpen(false);
    setOpenMenuId(null);
  };

  const handleAddMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: 'Thành viên mới',
      generation: 3,
      role: 'Con cháu',
      birthYear: '2000-01-01',
      gender: 'male',
      address: 'Hà Nội',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      bio: 'Thành viên mới được thêm vào hệ thống quản lý gia phả.',
      phone: '',
      facebook: '',
      instagram: '',
      childrenIds: []
    };
    setMembers((prev) => [newMember, ...prev]);
    handleOpenModal(newMember, true);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi gia phả?')) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setOpenMenuId(null);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setMembers((prev) =>
      prev.map((m) => (m.id === editForm.id ? editForm : m))
    );
    setActiveMember(editForm);
    setIsEditing(false);
  };

  const getMemberName = (id?: string) => {
    if (!id) return 'Không có';
    const found = members.find(m => m.id === id);
    return found ? found.name : 'Không rõ';
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGen = selectedGen === 'all' || member.generation.toString() === selectedGen;
    return matchesSearch && matchesGen;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'newest') {
      return Number(b.id) - Number(a.id);
    } else if (sortBy === 'generation') {
      return a.generation - b.generation;
    } else if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'birth-asc') {
      return new Date(a.birthYear).getTime() - new Date(b.birthYear).getTime();
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-primary-bg text-primary-text pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent mb-2">
              <Users className="w-6 h-6" />
              <span className="font-semibold uppercase tracking-wider text-sm">Gia Phả Dòng Họ</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Không Gian Văn Hóa & Kết Nối Dòng Họ</h1>
            <p className="text-gray-400 mt-1">Lưu giữ cội nguồn, kết nối các thế hệ trong dòng họ Nguyễn.</p>
          </div>

          <button 
            onClick={handleAddMember}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-lg shadow-accent/20 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm Thành Viên</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'members' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-bg hover:bg-white/5 text-gray-400'
            }`}
          >
            <Users className="w-4 h-4" /> Thành viên gia phả
          </button>
          <button
            onClick={() => setActiveTab('memorial')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'memorial' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-bg hover:bg-white/5 text-gray-400'
            }`}
          >
            <Calendar className="w-4 h-4" /> Lịch giỗ chạp (Âm lịch)
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'library' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-bg hover:bg-white/5 text-gray-400'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Thư viện dòng họ
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'map' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-bg hover:bg-white/5 text-gray-400'
            }`}
          >
            <Globe className="w-4 h-4" /> Bản đồ phân bố con cháu
          </button>
        </div>

        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="bg-secondary-bg border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Tìm kiếm thành viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-primary-bg border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                <select
                  value={selectedGen}
                  onChange={(e) => setSelectedGen(e.target.value)}
                  className="bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition cursor-pointer"
                >
                  <option value="all">Tất cả các đời</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Đời thứ {i + 1}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2 bg-primary-bg border border-white/10 rounded-xl px-3 py-1.5">
                  <ArrowUpDown className="w-4 h-4 text-accent shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-sm text-primary-text focus:outline-none transition cursor-pointer"
                  >
                    <option value="newest" className="bg-secondary-bg">Mới được thêm gần đây</option>
                    <option value="generation" className="bg-secondary-bg">Thứ tự thế hệ (Đời 1 → n)</option>
                    <option value="name-asc" className="bg-secondary-bg">Tên thành viên (A - Z)</option>
                    <option value="name-desc" className="bg-secondary-bg">Tên thành viên (Z - A)</option>
                    <option value="birth-asc" className="bg-secondary-bg">Ngày sinh (Cao niên trước)</option>
                  </select>
                </div>

                <div className="flex items-center bg-primary-bg border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`p-2 rounded-lg transition cursor-pointer ${viewMode === 'card' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Dạng Thẻ (Card)"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Dạng Danh Sách (List)"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => navigate('/family-tree/diagram')}
                    className="flex items-center gap-2 bg-secondary-bg hover:bg-white/10 text-primary-text px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium transition cursor-pointer ml-1"
                    title="Xem sơ đồ cây"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-accent" />
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-secondary-bg border border-white/10 rounded-2xl overflow-hidden hover:border-accent/50 transition flex flex-col relative"
                  >
                    <div className="absolute top-4 right-4 z-10" ref={openMenuId === member.id ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                        className="p-1.5 text-gray-400 hover:text-white bg-primary-bg/60 hover:bg-white/10 rounded-xl border border-white/5 transition cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === member.id && (
                        <div className="absolute right-0 mt-2 w-44 bg-secondary-bg border border-white/15 rounded-xl shadow-2xl py-1.5 z-20 backdrop-blur-md">
                          <button
                            onClick={() => handleOpenModal(member, false)}
                            className="w-full text-left px-4 py-2 text-xs text-primary-text hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-accent" />
                            <span>Xem chi tiết</span>
                          </button>
                          <button
                            onClick={() => handleOpenModal(member, true)}
                            className="w-full text-left px-4 py-2 text-xs text-primary-text hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Chỉnh sửa</span>
                          </button>
                          <div className="h-[1px] bg-white/10 my-1"></div>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa thành viên</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex items-start gap-4 pr-12">
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-accent/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent">
                            Đời thứ {member.generation}
                          </span>
                          <span className="text-xs text-gray-400">({member.gender === 'male' ? 'Nam' : 'Nữ'})</span>
                        </div>
                        <h3 className="text-lg font-bold truncate">{member.name}</h3>
                        <p className="text-sm text-gray-400 font-medium">{member.role}</p>
                      </div>
                    </div>

                    <div className="px-6 py-3 bg-primary-bg/50 border-t border-b border-white/5 space-y-2 text-xs text-gray-300 flex-grow">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span>Ngày sinh: {member.birthYear}</span>
                      </div>
                      {member.spouse && (
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>Bạn đời: {member.spouse}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>Nơi ở: {member.address}</span>
                      </div>
                      {(member.phone || member.facebook || member.instagram) && (
                        <div className="pt-1 flex flex-wrap gap-3 text-gray-400 border-t border-white/5 mt-1">
                          {member.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-accent"/> {member.phone}</span>}
                          {member.facebook && <span className="flex items-center gap-1"><FacebookIcon className="w-3 h-3 text-blue-400"/> {member.facebook}</span>}
                          {member.instagram && <span className="flex items-center gap-1"><InstagramIcon className="w-3 h-3 text-rose-400"/> {member.instagram}</span>}
                        </div>
                      )}
                    </div>

                    <div className="p-6 pt-4">
                      <p className="text-xs text-gray-400 italic line-clamp-2">"{member.bio}"</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-secondary-bg border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-primary-bg/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Thành viên</th>
                        <th className="py-4 px-6">Thế hệ</th>
                        <th className="py-4 px-6">Vai trò</th>
                        <th className="py-4 px-6">Ngày sinh</th>
                        <th className="py-4 px-6">Liên hệ</th>
                        <th className="py-4 px-6">Địa chỉ</th>
                        <th className="py-4 px-6 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {sortedMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-white/[0.02] transition relative">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-accent/30" />
                              <div>
                                <div className="font-bold text-primary-text">{member.name}</div>
                                <div className="text-xs text-gray-400">{member.gender === 'male' ? 'Nam' : 'Nữ'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent">
                              Đời {member.generation}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-medium text-gray-300">{member.role}</td>
                          <td className="py-4 px-6 text-gray-400">{member.birthYear}</td>
                          <td className="py-4 px-6 text-xs text-gray-400">
                            {member.phone ? <div>📞 {member.phone}</div> : null}
                            {member.facebook ? <div>FB: {member.facebook}</div> : null}
                            {!member.phone && !member.facebook ? '—' : null}
                          </td>
                          <td className="py-4 px-6 text-gray-400">{member.address}</td>
                          <td className="py-4 px-6 text-right relative">
                            <div className="inline-block" ref={openMenuId === member.id ? menuRef : null}>
                              <button 
                                onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer border border-white/5"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMenuId === member.id && (
                                <div className="absolute right-6 mt-1 w-44 bg-secondary-bg border border-white/15 rounded-xl shadow-2xl py-1.5 z-30 backdrop-blur-md text-left">
                                  <button
                                    onClick={() => handleOpenModal(member, false)}
                                    className="w-full text-left px-4 py-2 text-xs text-primary-text hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-accent" />
                                    <span>Xem chi tiết</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenModal(member, true)}
                                    className="w-full text-left px-4 py-2 text-xs text-primary-text hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Chỉnh sửa</span>
                                  </button>
                                  <div className="h-[1px] bg-white/10 my-1"></div>
                                  <button
                                    onClick={() => handleDeleteMember(member.id)}
                                    className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa thành viên</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'memorial' && <AncestorMemorial />}
        {activeTab === 'library' && <FamilyLibrary />}
        {activeTab === 'map' && <FamilyMapStats />}

      </div>

      <AnimatePresence>
        {activeMember && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-secondary-bg border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-secondary-bg/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  {isEditing && (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 transition cursor-pointer mr-1"
                      title="Quay lại xem chi tiết"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <h2 className="text-xl font-bold">
                    {isEditing ? 'Chỉnh Sửa Thông Tin' : 'Hồ Sơ Thành Viên'}
                  </h2>
                </div>
                <button 
                  onClick={() => setActiveMember(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isEditing ? (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                    <img 
                      src={activeMember.avatar} 
                      alt={activeMember.name} 
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-accent/30 shadow-lg"
                    />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent">
                          Đời thứ {activeMember.generation}
                        </span>
                        <span className="text-xs text-gray-400">({activeMember.gender === 'male' ? 'Nam' : 'Nữ'})</span>
                      </div>
                      <h3 className="text-2xl font-bold">{activeMember.name}</h3>
                      <p className="text-accent font-medium text-base">{activeMember.role}</p>
                      
                      <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-1">
                        <span className="inline-flex items-center gap-1.5 text-xs bg-primary-bg px-3 py-1.5 rounded-lg border border-white/5 text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          Ngày sinh: {activeMember.birthYear}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs bg-primary-bg px-3 py-1.5 rounded-lg border border-white/5 text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          {activeMember.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-primary-bg/40 p-4 rounded-2xl border border-white/5 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-1">Cha / Mẹ:</span>
                      <span className="font-semibold text-primary-text">
                        {getMemberName(activeMember.fatherId)} {activeMember.motherId ? `/ ${getMemberName(activeMember.motherId)}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">Con cái liên kết:</span>
                      <span className="font-semibold text-primary-text">
                        {activeMember.childrenIds && activeMember.childrenIds.length > 0 
                          ? activeMember.childrenIds.map(id => getMemberName(id)).join(', ') 
                          : 'Chưa có liên kết'}
                      </span>
                    </div>
                  </div>

                  {(activeMember.phone || activeMember.facebook || activeMember.instagram) && (
                    <div className="bg-primary-bg/60 p-4 rounded-2xl border border-white/5 space-y-2">
                      <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Thông tin liên hệ</h4>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                        {activeMember.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-accent"/> {activeMember.phone}</span>}
                        {activeMember.facebook && <span className="flex items-center gap-1.5"><FacebookIcon className="w-4 h-4 text-blue-400"/> {activeMember.facebook}</span>}
                        {activeMember.instagram && <span className="flex items-center gap-1.5"><InstagramIcon className="w-4 h-4 text-rose-400"/> {activeMember.instagram}</span>}
                      </div>
                    </div>
                  )}

                  {activeMember.spouse && (
                    <div className="bg-primary-bg/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Vợ / Chồng (Bạn đời)</span>
                          <span className="font-semibold text-sm">{activeMember.spouse}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                      <BookOpen className="w-4 h-4" />
                      <span>Tiểu sử & Cuộc đời</span>
                    </div>
                    <p className="text-sm text-gray-300 bg-primary-bg/50 p-4 rounded-2xl border border-white/5 leading-relaxed">
                      {activeMember.bio}
                    </p>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Chỉnh Sửa Thông Tin</span>
                    </button>
                    <button
                      onClick={() => setActiveMember(null)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveEdit} className="p-6 sm:p-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Họ và tên</label>
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Vai trò / Chức vụ</label>
                      <input 
                        type="text" 
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        required
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Thế hệ (Đời)</label>
                      <select 
                        value={editForm.generation}
                        onChange={(e) => setEditForm({ ...editForm, generation: Number(e.target.value) })}
                        required
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent cursor-pointer"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1} className="bg-secondary-bg">Đời thứ {i + 1}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Giới tính</label>
                      <select 
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as 'male' | 'female' })}
                        required
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="male" className="bg-secondary-bg">Nam</option>
                        <option value="female" className="bg-secondary-bg">Nữ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Ngày sinh</label>
                      <DatePicker 
                        selected={editForm.birthYear ? new Date(editForm.birthYear) : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            const formattedDate = date.toISOString().split('T')[0];
                            setEditForm({ ...editForm, birthYear: formattedDate });
                          }
                        }}
                        dateFormat="dd/MM/yyyy"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                        placeholderText="Chọn ngày sinh"
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent cursor-pointer"
                        wrapperClassName="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Vợ / Chồng (Bạn đời)</label>
                      <select 
                        value={editForm.spouse || ''}
                        onChange={(e) => setEditForm({ ...editForm, spouse: e.target.value })}
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="">-- Không có / Chưa kết hôn --</option>
                        {members
                          .filter(m => m.id !== editForm.id)
                          .map(m => (
                            <option key={m.id} value={m.name} className="bg-secondary-bg">
                              {m.name} (Đời {m.generation})
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Địa chỉ / Quê quán</label>
                      <input 
                        type="text" 
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        required
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* KHỐI 1: QUAN HỆ GIA ĐÌNH (ĐÓNG/MỞ) */}
                  <div className="bg-primary-bg/40 border border-white/5 rounded-2xl overflow-hidden transition">
                    <button 
                      type="button"
                      onClick={() => setIsRelationOpen(!isRelationOpen)}
                      className="w-full flex items-center justify-between p-4 text-xs font-bold text-accent uppercase tracking-wider hover:bg-white/5 transition cursor-pointer"
                    >
                      <span>1. Quan hệ huyết thống & Con cái (Tùy chọn)</span>
                      <span className={`transform transition-transform duration-200 ${isRelationOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    
                    {isRelationOpen && (
                      <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Chọn Cha</label>
                            <select 
                              value={editForm.fatherId || ''}
                              onChange={(e) => setEditForm({ ...editForm, fatherId: e.target.value })}
                              className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2 text-sm text-primary-text focus:outline-none focus:border-accent cursor-pointer"
                            >
                              <option value="">-- Không chọn / Không rõ --</option>
                              {members.filter(m => m.id !== editForm.id).map(m => (
                                <option key={m.id} value={m.id} className="bg-secondary-bg">{m.name} (Đời {m.generation})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Chọn Mẹ</label>
                            <select 
                              value={editForm.motherId || ''}
                              onChange={(e) => setEditForm({ ...editForm, motherId: e.target.value })}
                              className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2 text-sm text-primary-text focus:outline-none focus:border-accent cursor-pointer"
                            >
                              <option value="">-- Không chọn / Không rõ --</option>
                              {members.filter(m => m.id !== editForm.id).map(m => (
                                <option key={m.id} value={m.id} className="bg-secondary-bg">{m.name} (Đời {m.generation})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Con cái trong gia phả</label>
                          <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-primary-bg border border-white/10 rounded-xl items-center">
                            {editForm.childrenIds && editForm.childrenIds.length > 0 ? (
                              editForm.childrenIds.map(childId => {
                                const childObj = members.find(m => m.id === childId);
                                if (!childObj) return null;
                                return (
                                  <span 
                                    key={childId} 
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/20 text-accent border border-accent/30 text-xs font-medium"
                                  >
                                    <span>{childObj.name} (Đời {childObj.generation})</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = editForm.childrenIds?.filter(id => id !== childId);
                                        setEditForm({ ...editForm, childrenIds: updated });
                                      }}
                                      className="hover:text-white transition cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-gray-500 italic px-2">Chưa chọn người con nào</span>
                            )}
                          </div>

                          <select 
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              if (!selectedId) return;
                              const currentChildren = editForm.childrenIds || [];
                              if (!currentChildren.includes(selectedId)) {
                                setEditForm({ ...editForm, childrenIds: [...currentChildren, selectedId] });
                              }
                              e.target.value = "";
                            }}
                            className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2 text-xs text-primary-text focus:outline-none focus:border-accent cursor-pointer"
                          >
                            <option value="">+ Thêm con cái từ danh sách thành viên...</option>
                            {members
                              .filter(m => m.id !== editForm.id && !editForm.childrenIds?.includes(m.id))
                              .map(m => (
                                <option key={m.id} value={m.id} className="bg-secondary-bg">
                                  {m.name} (Đời {m.generation})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* KHỐI 2: THÔNG TIN LIÊN HỆ (ĐÓNG/MỞ) */}
                  <div className="bg-primary-bg/40 border border-white/5 rounded-2xl overflow-hidden transition">
                    <button 
                      type="button"
                      onClick={() => setIsContactOpen(!isContactOpen)}
                      className="w-full flex items-center justify-between p-4 text-xs font-bold text-accent uppercase tracking-wider hover:bg-white/5 transition cursor-pointer"
                    >
                      <span>2. Thông tin liên hệ & Mạng xã hội (Tùy chọn)</span>
                      <span className={`transform transition-transform duration-200 ${isContactOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    
                    {isContactOpen && (
                      <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Số điện thoại</label>
                            <input 
                              type="text" 
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              placeholder="0912..."
                              className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Facebook</label>
                            <input 
                              type="text" 
                              value={editForm.facebook || ''}
                              onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                              placeholder="Tên hoặc link FB"
                              className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Instagram</label>
                            <input 
                              type="text" 
                              value={editForm.instagram || ''}
                              onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                              placeholder="Tên IG"
                              className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Link ảnh Avatar</label>
                    <input 
                      type="text" 
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                      required
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Tiểu sử</label>
                    <textarea 
                      rows={3}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20"
                    >
                      <Save className="w-4 h-4" />
                      <span>Lưu Thay Đổi</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};