import React, { useCallback, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  addEdge,
  type Node,
  type Edge
} from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Plus, X, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface FamilyCoupleNode {
  id: string;
  generation: number;
  husband: { name: string; avatar: string; role: string };
  wife?: { name: string; avatar: string; role: string };
  childrenIds?: string[];
}

// Dữ liệu gia phả nhóm theo Cặp đôi (Couple) để gộp chung một thẻ
const familyCouplesData: FamilyCoupleNode[] = [
  {
    id: 'couple-1',
    generation: 1,
    husband: { name: 'Nguyễn Văn Đạo', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', role: 'Thủy tổ' },
    wife: { name: 'Trần Thị Mai', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200', role: 'Bà nội' },
    childrenIds: ['couple-2', 'person-3']
  },
  {
    id: 'couple-2',
    generation: 2,
    husband: { name: 'Nguyễn Văn Hùng', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', role: 'Trưởng nam' },
    wife: { name: 'Lê Thị Hoa', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', role: 'Mẹ' },
    childrenIds: ['couple-4', 'person-5']
  },
  {
    id: 'person-3',
    generation: 2,
    husband: { name: 'Nguyễn Thị Lan', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200', role: 'Cô ruột' },
    childrenIds: ['person-6']
  },
  {
    id: 'couple-4',
    generation: 3,
    husband: { name: 'Nguyễn Minh Tuấn', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', role: 'Trưởng nam (Tôi)' },
    wife: { name: 'Hoàng Thùy Linh', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', role: 'Vợ' },
    childrenIds: ['person-7']
  },
  {
    id: 'person-5',
    generation: 3,
    husband: { name: 'Nguyễn Thanh Hà', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', role: 'Em gái ruột' }
  },
  {
    id: 'person-6',
    generation: 3,
    husband: { name: 'Phạm Văn Nam', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200', role: 'Anh em họ' }
  },
  {
    id: 'person-7',
    generation: 4,
    husband: { name: 'Nguyễn Gia Bảo', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200', role: 'Con trai đích tôn' }
  }
];

const generateCoupleNodesAndEdges = () => {
  const generatedNodes: Node[] = [];
  const generatedEdges: Edge[] = [];
  const genCounts: Record<number, number> = {};

  familyCouplesData.forEach((item) => {
    const gen = item.generation;
    if (!genCounts[gen]) genCounts[gen] = 0;
    
    const yPos = (gen - 1) * 280 + 50;
    const xPos = genCounts[gen] * 320 + (gen % 2 === 0 ? 50 : 200);

    generatedNodes.push({
      id: item.id,
      type: 'default',
      position: { x: xPos, y: yPos },
      data: { 
        label: (
          <div className="p-3.5 bg-secondary-bg border border-white/20 hover:border-accent rounded-3xl shadow-2xl text-center w-64 transition cursor-pointer backdrop-blur-md">
            {item.wife ? (
              // Giao diện Thẻ Cặp đôi (Vợ & Chồng chung một thẻ)
              <div>
                <div className="flex items-center justify-center gap-3 mb-2.5">
                  <img src={item.husband.avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-accent/70 shadow-md" />
                  <div className="p-1.5 rounded-full bg-rose-500/10 text-rose-500 animate-pulse">
                    <Heart className="w-4 h-4 fill-rose-500/20" />
                  </div>
                  <img src={item.wife.avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/30 shadow-md" />
                </div>
                <p className="font-bold text-xs text-primary-text">{item.husband.name} & {item.wife.name}</p>
                <p className="text-[10px] text-accent font-semibold uppercase mt-1">Đời {item.generation} • Gia Đình</p>
              </div>
            ) : (
              // Giao diện Thẻ Cá nhân đơn lẻ
              <div>
                <img src={item.husband.avatar} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-accent/60 shadow-md" />
                <p className="font-bold text-xs text-primary-text">{item.husband.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase mt-1">Đời {item.generation} • {item.husband.role}</p>
              </div>
            )}
          </div>
        ) 
      }
    });

    genCounts[gen] += 1;

    // Tạo đường nối từ cặp đôi xuống các con
    if (item.childrenIds && item.childrenIds.length > 0) {
      item.childrenIds.forEach(childId => {
        generatedEdges.push({
          id: `e${item.id}-${childId}`,
          source: item.id,
          target: childId,
          animated: true,
          style: { stroke: '#0f62fe', strokeWidth: 2 }
        });
      });
    }
  });

  return { generatedNodes, generatedEdges };
};

export const FamilyTreeDiagram: React.FC = () => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '', generation: 2, role: '', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
  });

  const { generatedNodes, generatedEdges } = generateCoupleNodesAndEdges();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(generatedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(generatedEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#0f62fe', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const handleCreateMemberNode = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now().toString();

    const newNode = {
      id: newId,
      type: 'default',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: (
          <div className="p-3.5 bg-secondary-bg border border-accent rounded-3xl shadow-2xl text-center w-56">
            <img src={newMemberForm.avatar} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-accent shadow-md" />
            <p className="font-bold text-xs text-primary-text">{newMemberForm.name}</p>
            <p className="text-[10px] text-accent font-semibold uppercase mt-1">Đời {newMemberForm.generation} • {newMemberForm.role}</p>
          </div>
        )
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setIsAddModalOpen(false);
    setNewMemberForm({ name: '', generation: 2, role: '', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' });
  };

  return (
    <div className="min-h-screen bg-primary-bg text-primary-text flex flex-col pt-24">
      {/* Thanh điều hướng */}
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
            <h1 className="text-xl font-bold">Sơ Đồ Phả Hệ (Dạng Cặp Đôi)</h1>
            <p className="text-xs text-gray-400">Vợ chồng gộp chung một thẻ, kết nối gọn gàng xuống các thế hệ con cháu.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Thẻ Tự Do</span>
        </button>
      </div>

      {/* Mindmap */}
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
      
      {/* Modal Thêm Thẻ */}
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
                <h2 className="text-xl font-bold">Thêm Thẻ Thành Viên Mới</h2>
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
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Vai trò</label>
                    <input 
                      type="text" 
                      value={newMemberForm.role}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                      required
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Đời thứ</label>
                    <input 
                      type="number" 
                      value={newMemberForm.generation}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, generation: Number(e.target.value) })}
                      required
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Avatar URL</label>
                    <input 
                      type="text" 
                      value={newMemberForm.avatar}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, avatar: e.target.value })}
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 bg-white/10 text-sm font-medium rounded-xl">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-xl">Tạo Thẻ</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};