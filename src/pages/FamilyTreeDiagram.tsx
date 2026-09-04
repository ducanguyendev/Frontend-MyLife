import React, {  useCallback, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  addEdge
} from '@xyflow/react';
import type { Connection,  } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const initialNodes = [
  // --- TẦNG 1: ÔNG BÀ (Thủy tổ / Đời 1) ---
  {
    id: 'couple-1',
    type: 'default',
    position: { x: 500, y: 50 },
    data: { 
      label: (
        <div className="p-3 bg-secondary-bg border border-accent/60 rounded-2xl shadow-xl text-center w-60">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80" alt="" className="w-10 h-10 rounded-full object-cover border border-accent" />
            <span className="text-rose-500 font-bold"> & </span>
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=80" alt="" className="w-10 h-10 rounded-full object-cover border border-white/20" />
          </div>
          <p className="font-bold text-xs text-primary-text">Nguyễn Văn Đạo & Trần Thị Mai</p>
          <p className="text-[10px] text-accent font-semibold uppercase mt-1">Đời 1 • Ông Bà (Thủy Tổ)</p>
        </div>
      ) 
    },
  },

  // --- TẦNG 2: CHA MẸ, CÔ, CHÚ, BÁC (Đời 2 - phân bổ dàn đều sang trái/phải) ---
  {
    id: 'couple-2',
    type: 'default',
    position: { x: 200, y: 280 }, // Nhánh trưởng nam bên trái
    data: { 
      label: (
        <div className="p-3 bg-secondary-bg border border-white/20 rounded-2xl shadow-xl text-center w-60">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80" alt="" className="w-10 h-10 rounded-full object-cover border border-white/20" />
            <span className="text-rose-500 font-bold"> & </span>
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80" alt="" className="w-10 h-10 rounded-full object-cover border border-white/20" />
          </div>
          <p className="font-bold text-xs text-primary-text">Nguyễn Văn Hùng & Lê Thị Hoa</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase mt-1">Đời 2 • Cha Mẹ (Trưởng Nam)</p>
        </div>
      ) 
    },
  },
  {
    id: 'person-3',
    type: 'default',
    position: { x: 850, y: 280 }, // Nhánh cô/chú/bác bên phải
    data: { 
      label: (
        <div className="p-3 bg-secondary-bg border border-white/20 rounded-2xl shadow-xl text-center w-52">
          <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=80" alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-white/20" />
          <p className="font-bold text-sm text-primary-text">Nguyễn Thị Lan</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Đời 2 • Cô / Út Thím</p>
        </div>
      ) 
    },
  },

  // --- TẦNG 3: CON CÁI, ANH CHỊ EM RUỘT & HỌ HÀNG (Đời 3) ---
  {
    id: 'person-4',
    type: 'default',
    position: { x: 50, y: 510 }, // Con của Trưởng Nam (Nhánh 1)
    data: { 
      label: (
        <div className="p-3 bg-secondary-bg border border-white/20 rounded-2xl shadow-xl text-center w-48">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80" alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-white/20" />
          <p className="font-bold text-sm text-primary-text">Nguyễn Minh Tuấn</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Đời 3 • Anh Trai (Trưởng)</p>
        </div>
      ) 
    },
  },
  {
    id: 'person-5',
    type: 'default',
    position: { x: 350, y: 510 }, // Anh chị em ruột với Tuấn (Con thứ)
    data: { 
      label: (
        <div className="p-3 bg-secondary-bg border border-white/20 rounded-2xl shadow-xl text-center w-48">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80" alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-white/20" />
          <p className="font-bold text-sm text-primary-text">Nguyễn Hoàng Nam</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Đời 3 • Em Trai (Ruột)</p>
        </div>
      ) 
    },
  },
  {
    id: 'person-6',
    type: 'default',
    position: { x: 800, y: 510 }, // Anh chị em họ (Con của cô Lan)
    data: { 
      label: (
        <div className="p-3 bg-secondary-bg border border-white/20 rounded-2xl shadow-xl text-center w-48">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80" alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-white/20" />
          <p className="font-bold text-sm text-primary-text">Phạm Minh Thư</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Đời 3 • Anh Chị Em Họ</p>
        </div>
      ) 
    },
  }
];

// --- THIẾT LẬP ĐƯỜNG NỐI (EDGES) GIỮA CÁC THẾ HỆ ---
const initialEdges = [
  // Ông bà sinh ra cha mẹ & cô chú (Đời 1 nối xuống Đời 2)
  { id: 'e1-2', source: 'couple-1', target: 'couple-2', animated: true, style: { stroke: '#0f62fe', strokeWidth: 2 } },
  { id: 'e1-3', source: 'couple-1', target: 'person-3', animated: true, style: { stroke: '#0f62fe', strokeWidth: 2 } },

  // Cha mẹ sinh ra các con ruột (Đời 2 nối xuống Đời 3)
  { id: 'e2-4', source: 'couple-2', target: 'person-4', animated: true, style: { stroke: '#0f62fe', strokeWidth: 2 } },
  { id: 'e2-5', source: 'couple-2', target: 'person-5', animated: true, style: { stroke: '#0f62fe', strokeWidth: 2 } },

  // Cô Lan sinh ra anh chị em họ
  { id: 'e3-6', source: 'person-3', target: 'person-6', animated: true, style: { stroke: '#0f62fe', strokeWidth: 2 } },
];

export const FamilyTreeDiagram: React.FC = () => {
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    generation: 2,
    role: '',
    birthYear: '',
    address: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    bio: ''
  });
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#0f62fe', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  // Hàm thêm node mới trực tiếp lên sơ đồ mindmap
//   const handleAddNode = () => {
//     const newId = Date.now().toString();
//     const newNode = {
//       id: newId,
//       type: 'default',
//       position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 300 },
//       data: {
//         label: (
//           <div className="p-3 bg-secondary-bg border border-white/20 rounded-2xl shadow-xl text-center w-48">
//             <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-white/20" />
//             <p className="font-bold text-sm text-primary-text">Thành Viên Mới</p>
//             <p className="text-[10px] text-accent font-semibold uppercase">Đời Mới</p>
//           </div>
//         )
//       }
//     };
//     setNodes((nds) => [...nds, newNode]);
//   };

  const handleCreateMemberNode = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now().toString();

    // Tạo node mới với giao diện thẻ card chứa thông tin vừa nhập
    const newNode = {
      id: newId,
      type: 'output',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 300 },
      data: {
        label: (
          <div className="p-3 bg-secondary-bg border border-white/20 rounded-2xl shadow-xl text-center w-52">
            <img src={newMemberForm.avatar} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-accent" />
            <p className="font-bold text-sm text-primary-text">{newMemberForm.name}</p>
            <p className="text-[10px] text-accent font-semibold uppercase">Đời {newMemberForm.generation} • {newMemberForm.role}</p>
          </div>
        )
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setIsAddModalOpen(false); // Đóng modal
    // Reset form
    setNewMemberForm({
      name: '',
      generation: 2,
      role: '',
      birthYear: '',
      address: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      bio: ''
    });
  };

  return (
    <div className="min-h-screen bg-primary-bg text-primary-text flex flex-col pt-24">
      {/* Thanh điều hướng phía trên */}
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/family-tree')}
            className="p-2 bg-secondary-bg hover:bg-white/10 rounded-xl border border-white/10 transition cursor-pointer flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại dạng Bảng</span>
          </button>
          <div>
            <h1 className="text-xl font-bold">Sơ Đồ Phả Hệ Trực Quan (Mindmap)</h1>
            <p className="text-xs text-gray-400">Kéo thả các thẻ thành viên hoặc nối các mối quan hệ gia đình tùy ý.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Thành Viên Vào Sơ Đồ</span>
        </button>
      </div>

      {/* Khu vực vẽ Mindmap */}
      <div className="flex-grow w-full h-[calc(100vh-140px)] border-t border-white/15 bg-primary-bg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          colorMode="dark"
        >
          <Controls className="bg-secondary-bg border border-white/15 rounded-xl overflow-hidden shadow-lg fill-white" />
          <MiniMap className="bg-secondary-bg border border-white/15 rounded-xl overflow-hidden shadow-lg" zoomable pannable />
          <Background gap={20} size={1} color="#333" />
        </ReactFlow>
      </div>
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-secondary-bg border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-secondary-bg/90 backdrop-blur-md z-10">
                <h2 className="text-xl font-bold">Thêm Thành Viên Mới Vào Sơ Đồ</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMemberNode} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Họ và tên</label>
                    <input 
                      type="text" 
                      value={newMemberForm.name}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Vai trò / Chức vụ</label>
                    <input 
                      type="text" 
                      value={newMemberForm.role}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                      required
                      placeholder="Ví dụ: Trưởng nam"
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Đời thứ mấy</label>
                    <input 
                      type="number" 
                      value={newMemberForm.generation}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, generation: Number(e.target.value) })}
                      required
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Năm sinh</label>
                    <input 
                      type="text" 
                      value={newMemberForm.birthYear}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, birthYear: e.target.value })}
                      placeholder="Ví dụ: 1990"
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Link ảnh Avatar</label>
                  <input 
                    type="text" 
                    value={newMemberForm.avatar}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, avatar: e.target.value })}
                    required
                    className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Tiểu sử</label>
                  <textarea 
                    rows={2}
                    value={newMemberForm.bio}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, bio: e.target.value })}
                    placeholder="Vài dòng tiểu sử..."
                    className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20"
                  >
                    <span>Thêm Vào Sơ Đồ</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    
  );
};