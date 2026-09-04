import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CustomCursor } from './components/CustomCursor';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { LoadingScreen } from './components/LoadingScreen';
import { Header } from './layouts/Header';
import { Footer } from './layouts/Footer';
import { Hero } from './pages/Hero';
import { About } from './pages/About';
import { Skills } from './pages/Skills';
import { Projects } from './pages/Projects';
import { Experience } from './pages/Experience';
import { Stats } from './pages/Stats';
import { Contact } from './pages/Contact';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { Forbidden } from './pages/Forbidden';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useLanguage } from './hooks/useLanguage';
import { FamilyTree } from './pages/FamilyTree';
import { FamilyTreeDiagram } from './pages/FamilyTreeDiagram';

function MainPortfolio() {
  return (
    <div className="flex flex-col min-h-screen bg-primary-bg text-primary-text relative antialiased selection:bg-accent selection:text-white">
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
  const [isLoading, setIsLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    // Simulate loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

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
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loader" />}
      </AnimatePresence>

      {!isLoading && (
        <Routes>
          <Route path="/" element={<MainPortfolio />} />
          <Route path="/home" element={<MainPortfolio />} />
          <Route path="/Home" element={<MainPortfolio />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/register" element={<Register />} />
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
          <Route path="/family-tree" element={<FamilyTree />} />
          <Route path="/gia-pha" element={<FamilyTree />} />
          <Route path="/family-tree/diagram" element={<FamilyTreeDiagram />} />
        </Routes>
      )}
    </>
  );
}

export default App;
