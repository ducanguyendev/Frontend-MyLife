import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CustomCursor } from '@/shared/components/CustomCursor';
import { ScrollProgressBar } from '@/shared/components/ScrollProgressBar';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { Header } from '@/shared/layouts/Header';
import { Footer } from '@/shared/layouts/Footer';
import { Hero } from '@/features/portfolio/pages/Hero';
import { About } from '@/features/portfolio/pages/About';
import { Skills } from '@/features/portfolio/pages/Skills';
import { Projects } from '@/features/portfolio/pages/Projects';
import { Experience } from '@/features/portfolio/pages/Experience';
import { Stats } from '@/features/portfolio/pages/Stats';
import { Contact } from '@/features/portfolio/pages/Contact';
import { Register } from '@/features/auth/pages/Register';
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard';
import { FamilyTreePage } from '@/features/family-tree/pages/FamilyTreePage';
import { Forbidden } from '@/features/portfolio/pages/Forbidden';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { NotificationProvider } from '@/shared/contexts/NotificationContext';
import { SessionExpiredModal } from '@/features/auth/components/SessionExpiredModal';
import { LoginModal } from '@/features/auth/components/LoginModal';

function MainPortfolio() {
  return (
    <div className="flex flex-col min-h-screen bg-primary-bg font-sans overflow-x-hidden transition-colors duration-300 relative antialiased">
      {/* Global UI Extras */}
      <CustomCursor />
      <ScrollProgressBar />

      {/* Sticky Navigation Header */}
      <Header />

      {/* Main Layout Sections */}
      <main className="flex-grow">
        <Hero />
        <About />
        <Stats />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { language, t } = useLanguage();

  const [isSessionExpiredOpen, setIsSessionExpiredOpen] = useState(false);
  const [isGlobalLoginOpen, setIsGlobalLoginOpen] = useState(false);

  useEffect(() => {
    // Simulate loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Lắng nghe sự kiện hết hạn token trên toàn hệ thống
  useEffect(() => {
    const handleExpired = () => {
      setIsSessionExpiredOpen(true);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const handleConfirmSessionExpired = () => {
    setIsSessionExpiredOpen(false);
    navigate('/Home');
    setIsGlobalLoginOpen(true);
  };

  // Dynamically update document SEO metadata based on selected language
  useEffect(() => {
    if (isLoading) return;

    // Document Title & Html Lang attribute
    document.title = t('common.seo.title');
    document.documentElement.lang = language;

    // Description Meta
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', t('common.seo.desc'));
  }, [language, t, isLoading]);

  return (
    <NotificationProvider>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loader" />}
      </AnimatePresence>

      {!isLoading && (
        <>
          <Routes>
            <Route path="/" element={<MainPortfolio />} />
            <Route path="/home" element={<MainPortfolio />} />
            <Route path="/Home" element={<MainPortfolio />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/FamilyTree"
              element={
                <ProtectedRoute>
                  <FamilyTreePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/family-tree"
              element={
                <ProtectedRoute>
                  <FamilyTreePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Home/FamilyTree"
              element={
                <ProtectedRoute>
                  <FamilyTreePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home/family-tree"
              element={
                <ProtectedRoute>
                  <FamilyTreePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Home/Admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/403" element={<Forbidden />} />
            <Route path="*" element={<MainPortfolio />} />
          </Routes>

          {/* Hộp thoại thông báo hết hạn phiên làm việc - bắt buộc bấm Xác nhận */}
          <SessionExpiredModal
            isOpen={isSessionExpiredOpen}
            onConfirm={handleConfirmSessionExpired}
          />

          {/* Form đăng nhập hiển thị ngay sau khi người dùng xác nhận thông báo hết hạn */}
          <LoginModal
            isOpen={isGlobalLoginOpen}
            onClose={() => setIsGlobalLoginOpen(false)}
          />
        </>
      )}
    </NotificationProvider>
  );
}

export default App;
