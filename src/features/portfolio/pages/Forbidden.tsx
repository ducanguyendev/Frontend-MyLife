import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, Home } from 'lucide-react';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <ShieldOff size={40} className="text-red-500" />
          </div>
        </div>
        <h1 className="text-6xl font-black text-primary-text mb-2">403</h1>
        <h2 className="text-xl font-bold text-primary-text mb-3">Truy cập bị từ chối</h2>
        <p className="text-secondary-text text-sm mb-8">
          Bạn không có quyền truy cập vào trang này. Chỉ quản trị viên mới được phép vào khu vực này.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-black font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Home size={16} />
          Về trang chủ
        </button>
      </motion.div>
    </div>
  );
};
