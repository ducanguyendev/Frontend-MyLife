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
  Globe
} from 'lucide-react';

import { AncestorMemorial } from '../components/family/AncestorMemorial';
import { FamilyLibrary } from '../components/family/FamilyLibrary';
import { FamilyMapStats } from '../components/family/FamilyMapStats';

interface FamilyMember {
  id: string;
  name: string;
  generation: number;
  role: string;
  birthYear: string;
  deathYear?: string;
  lunarDeathDate?: string;
  gender: 'male' | 'female';
  spouse?: string;
  address: string;
  avatar: string;
  bio: string;
}

const initialFamilyMembers: FamilyMember[] = [
  {
    id: '1',
    name: 'Nguyễn Văn Đạo',
    generation: 1,
    role: 'Thủy tổ dòng họ',
    birthYear: '1920',
    deathYear: '1995',
    lunarDeathDate: '15/08 Âm lịch',
    gender: 'male',
    spouse: 'Trần Thị Mai',
    address: 'Nam Định',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    bio: 'Người có công khai hoang lập nghiệp và xây dựng từ đường dòng họ Nguyễn.'
  },
  {
    id: '2',
    name: 'Nguyễn Văn Hùng',
    generation: 2,
    role: 'Trưởng nam (Đời 2)',
    birthYear: '1950',
    gender: 'male',
    spouse: 'Lê Thị Hoa',
    address: 'Hà Nội',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    bio: 'Cựu giáo viên toán, hiện đang sinh sống và thờ cúng tổ tiên tại nhà thờ họ.'
  },
  {
    id: '3',
    name: 'Nguyễn Thị Lan',
    generation: 2,
    role: 'Con gái thứ',
    birthYear: '1955',
    gender: 'female',
    spouse: 'Phạm Văn Minh',
    address: 'Hải Phòng',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    bio: 'Doanh nhân thành đạt, luôn quan tâm và tài trợ quỹ khuyến học dòng họ.'
  },
  {
    id: '4',
    name: 'Nguyễn Minh Tuấn',
    generation: 3,
    role: 'Cháu đích tôn (Đời 3)',
    birthYear: '1982',
    gender: 'male',
    spouse: 'Hoàng Thùy Linh',
    address: 'TP. Hồ Chí Minh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    bio: 'Kỹ sư phần mềm công nghệ cao, quản lý hệ thống gia phả số hóa của dòng họ.'
  },
  {
    id: '5',
    name: 'Nguyễn Thanh Hà',
    generation: 3,
    role: 'Cháu nội',
    birthYear: '1988',
    gender: 'female',
    address: 'Đà Nẵng',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    bio: 'Bác sĩ bệnh viện đa khoa trung ương.'
  }
];

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
    setEditForm({ ...member });
    setIsEditing(editMode);
    setOpenMenuId(null);
  };

  const handleAddMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: 'Nguyễn Văn Mới',
      generation: 3,
      role: 'Thành viên mới',
      birthYear: '2000',
      gender: 'male',
      address: 'Hà Nội',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      bio: 'Thành viên mới được thêm vào hệ thống quản lý gia phả.'
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
      return Number(a.birthYear) - Number(b.birthYear);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-primary-bg text-primary-text pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Tiêu đề trang */}
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

        {/* --- THANH TAB CHUYỂN ĐỔI TÍNH NĂNG --- */}
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

        {/* --- TAB 1: THÀNH VIÊN GIA PHẢ (Giao diện Card / List chuẩn) --- */}
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
                  <option value="1">Đời thứ 1</option>
                  <option value="2">Đời thứ 2</option>
                  <option value="3">Đời thứ 3</option>
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
                    <option value="birth-asc" className="bg-secondary-bg">Năm sinh (Cao niên trước)</option>
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
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-1">
                          Đời thứ {member.generation}
                        </span>
                        <h3 className="text-lg font-bold truncate">{member.name}</h3>
                        <p className="text-sm text-gray-400 font-medium">{member.role}</p>
                      </div>
                    </div>

                    <div className="px-6 py-3 bg-primary-bg/50 border-t border-b border-white/5 space-y-2 text-xs text-gray-300 flex-grow">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span>Năm sinh: {member.birthYear} {member.deathYear ? `- ${member.deathYear}` : '(Còn sống)'}</span>
                      </div>
                      {member.spouse && (
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>Phối ngẫu: {member.spouse}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>Quê quán/Nơi ở: {member.address}</span>
                      </div>
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
                        <th className="py-4 px-6">Năm sinh / Mất</th>
                        <th className="py-4 px-6">Phối ngẫu</th>
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
                          <td className="py-4 px-6 text-gray-400">
                            {member.birthYear} {member.deathYear ? `- ${member.deathYear}` : ''}
                          </td>
                          <td className="py-4 px-6 text-gray-400">{member.spouse || '—'}</td>
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

            {sortedMembers.length === 0 && (
              <div className="text-center py-16 bg-secondary-bg border border-white/10 rounded-2xl mt-4">
                <User className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold">Không tìm thấy thành viên phù hợp</h3>
                <p className="text-gray-400 text-sm mt-1">Hãy thử tìm kiếm với từ khóa hoặc bộ lọc khác.</p>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: LỊCH GIỖ CHẠP ÂM LỊCH --- */}
        {activeTab === 'memorial' && <AncestorMemorial />}

        {/* --- TAB 3: THƯ VIỆN & KỶ VẬT CỔ --- */}
        {activeTab === 'library' && <FamilyLibrary />}

        {/* --- TAB 4: BẢN ĐỒ PHÂN BỐ CON CHÁU --- */}
        {activeTab === 'map' && <FamilyMapStats />}

      </div>

      {/* MODAL CHI TIẾT & CHỈNH SỬA THÀNH VIÊN */}
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
                          {activeMember.birthYear} {activeMember.deathYear ? `- ${activeMember.deathYear}` : '(Còn sống)'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs bg-primary-bg px-3 py-1.5 rounded-lg border border-white/5 text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          {activeMember.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeMember.spouse && (
                    <div className="bg-primary-bg/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Vợ / Chồng (Phối ngẫu)</span>
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
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Đời thứ mấy</label>
                      <input 
                        type="number" 
                        value={editForm.generation}
                        onChange={(e) => setEditForm({ ...editForm, generation: Number(e.target.value) })}
                        required
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Năm sinh</label>
                      <input 
                        type="text" 
                        value={editForm.birthYear}
                        onChange={(e) => setEditForm({ ...editForm, birthYear: e.target.value })}
                        required
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Năm mất (nếu có)</label>
                      <input 
                        type="text" 
                        value={editForm.deathYear || ''}
                        onChange={(e) => setEditForm({ ...editForm, deathYear: e.target.value })}
                        placeholder="Để trống nếu còn sống"
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Phối ngẫu (Vợ/Chồng)</label>
                      <input 
                        type="text" 
                        value={editForm.spouse || ''}
                        onChange={(e) => setEditForm({ ...editForm, spouse: e.target.value })}
                        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                      />
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