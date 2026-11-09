import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
const MyLifeLandingPage = lazy(() => import('@/features/landing/pages/MyLifeLandingPage').then(module => ({ default: module.MyLifeLandingPage })));
const Register = lazy(() => import('@/features/auth/pages/Register').then(module => ({ default: module.Register })));
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const FamilyTreePage = lazy(() => import('@/features/family-tree/pages/FamilyTreePage').then(module => ({ default: module.FamilyTreePage })));
const MyLifeHubPage = lazy(() => import('@/features/my-life/pages/MyLifeHubPage').then(module => ({ default: module.MyLifeHubPage })));
const AnniversariesPage = lazy(() => import('@/features/my-life/pages/AnniversariesPage').then(module => ({ default: module.AnniversariesPage })));
const LibraryPage = lazy(() => import('@/features/my-life/pages/LibraryPage').then(module => ({ default: module.LibraryPage })));
const FamilyMapPage = lazy(() => import('@/features/my-life/pages/FamilyMapPage').then(module => ({ default: module.FamilyMapPage })));
const FamilyTimelinePage = lazy(() => import('@/features/my-life/pages/FamilyTimelinePage').then(module => ({ default: module.FamilyTimelinePage })));
const FamilyMemberProfilePage = lazy(() => import('@/features/my-life/pages/FamilyMemberProfilePage').then(module => ({ default: module.FamilyMemberProfilePage })));
const DesignSystemPage = import.meta.env.DEV ? lazy(() => import('@/design-system/pages/DesignSystemPage').then(module => ({ default: module.DesignSystemPage }))) : null;
import { Forbidden } from '@/features/portfolio/pages/Forbidden';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { NotificationProvider } from '@/shared/contexts/NotificationContext';
import { SessionExpiredModal } from '@/features/auth/components/SessionExpiredModal';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { LoginModal } from '@/features/auth/components/LoginModal';

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

    // Match the former public header's event scope. A transient protected-route
    // render during intentional logout must not reopen the login overlay.
    const isAppRoute = /^\/(mylife(?:\/family\/member\/[^/]+)?|familytree|anniversaries|library|map|timeline|home\/admin)\/?$/i.test(location.pathname);
    const handleOpenLogin = () => {
      if (!isAppRoute) queueMicrotask(() => setIsGlobalLoginOpen(true));
    };
    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('ui:openLogin', handleOpenLogin);
    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('ui:openLogin', handleOpenLogin);
    };
  }, [location.pathname]);

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
            {DesignSystemPage && <Route caseSensitive path="/dev/design-system" element={<DesignSystemPage />} />}
            <Route path="/" element={<MyLifeLandingPage />} />
            <Route path="/home" element={<MyLifeLandingPage />} />
            <Route path="/Home" element={<MyLifeLandingPage />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/register" element={<Register />} />
            <Route caseSensitive path="/mylife" element={<ProtectedRoute requiredRole="USER"><MyLifeHubPage /></ProtectedRoute>} />
            <Route caseSensitive path="/familytree" element={<ProtectedRoute requiredRole="USER"><FamilyTreePage /></ProtectedRoute>} />
            <Route caseSensitive path="/anniversaries" element={<ProtectedRoute requiredRole="USER"><AnniversariesPage /></ProtectedRoute>} />
            <Route caseSensitive path="/library" element={<ProtectedRoute requiredRole="USER"><LibraryPage /></ProtectedRoute>} />
            <Route caseSensitive path="/map" element={<ProtectedRoute requiredRole="USER"><FamilyMapPage /></ProtectedRoute>} />
            <Route caseSensitive path="/timeline" element={<ProtectedRoute requiredRole="USER"><FamilyTimelinePage /></ProtectedRoute>} />
            <Route caseSensitive path="/mylife/family/member/:id" element={<ProtectedRoute requiredRole="USER"><FamilyMemberProfilePage /></ProtectedRoute>} />
            <Route caseSensitive path="/timeline" element={<ProtectedRoute requiredRole="USER"><FamilyTimelinePage /></ProtectedRoute>} />
            <Route caseSensitive path="/mylife/family/member/:id" element={<ProtectedRoute requiredRole="USER"><FamilyMemberProfilePage /></ProtectedRoute>} />
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
            <Route path="*" element={<MyLifeLandingPage />} />
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
