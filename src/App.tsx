import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
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
const Register = lazy(() => import('@/features/auth/pages/Register').then(module => ({ default: module.Register })));
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const FamilyTreePage = lazy(() => import('@/features/family-tree/pages/FamilyTreePage').then(module => ({ default: module.FamilyTreePage })));
const MyLifeHubPage = lazy(() => import('@/features/my-life/pages/MyLifeHubPage').then(module => ({ default: module.MyLifeHubPage })));
const AnniversariesPage = lazy(() => import('@/features/my-life/pages/AnniversariesPage').then(module => ({ default: module.AnniversariesPage })));
const LibraryPage = lazy(() => import('@/features/my-life/pages/LibraryPage').then(module => ({ default: module.LibraryPage })));
const FamilyMapPage = lazy(() => import('@/features/my-life/pages/FamilyMapPage').then(module => ({ default: module.FamilyMapPage })));
import { Forbidden } from '@/features/portfolio/pages/Forbidden';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { NotificationProvider } from '@/shared/contexts/NotificationContext';
import { SessionExpiredModal } from '@/features/auth/components/SessionExpiredModal';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { LoginModal } from '@/features/auth/components/LoginModal';

function MainPortfolio() {
  return (
    <div className="flex flex-col min-h-screen bg-primary-bg font-sans overflow-x-hidden transition-colors duration-300 relative antialiased">
      {/* Global UI Extras */}
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
  const location = useLocation();
  const { isLoading } = useAuth();
  const { language, t } = useLanguage();

  const [isSessionExpiredOpen, setIsSessionExpiredOpen] = useState(false);
  const [isGlobalLoginOpen, setIsGlobalLoginOpen] = useState(false);

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
      {isLoading && <LoadingScreen />}

      {!isLoading && (
        <>
          <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<MainPortfolio />} />
            <Route path="/home" element={<MainPortfolio />} />
            <Route path="/Home" element={<MainPortfolio />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/register" element={<Register />} />
            <Route caseSensitive path="/mylife" element={<ProtectedRoute requiredRole="USER"><MyLifeHubPage /></ProtectedRoute>} />
            <Route caseSensitive path="/familytree" element={<ProtectedRoute requiredRole="USER"><FamilyTreePage /></ProtectedRoute>} />
            <Route caseSensitive path="/anniversaries" element={<ProtectedRoute requiredRole="USER"><AnniversariesPage /></ProtectedRoute>} />
            <Route caseSensitive path="/library" element={<ProtectedRoute requiredRole="USER"><LibraryPage /></ProtectedRoute>} />
            <Route caseSensitive path="/map" element={<ProtectedRoute requiredRole="USER"><FamilyMapPage /></ProtectedRoute>} />
            <Route caseSensitive path="/MyLife" element={<Navigate replace to="/mylife" />} />
            <Route caseSensitive path="/Mylife" element={<Navigate replace to="/mylife" />} />
            <Route caseSensitive path="/FamilyTree" element={<Navigate replace to="/familytree" />} />
            <Route caseSensitive path="/family-tree" element={<Navigate replace to="/familytree" />} />
            <Route caseSensitive path="/Home/FamilyTree" element={<Navigate replace to="/familytree" />} />
            <Route caseSensitive path="/home/family-tree" element={<Navigate replace to="/familytree" />} />
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
          </Suspense>
          </ErrorBoundary>

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
