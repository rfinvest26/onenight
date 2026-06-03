import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle } from 'lucide-react';

// Components
import Catalog from './pages/Catalog';
import ModelProfile from './pages/ModelProfile';
import { useReferral } from './hooks/useReferral';
import { useGlobalSupport } from './hooks/useGlobalSupport';
import BottomSheet from './components/BottomSheet';
import SupportChat from './components/SupportChat';

function App() {
  const { country } = useReferral();
  const { 
    globalThreadId, 
    isSupportOpen, 
    isUsernamePromptOpen,
    usernameInput,
    setUsernameInput,
    submitUsername,
    setIsUsernamePromptOpen,
    openSupport, 
    closeSupport 
  } = useGlobalSupport();
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';

  return (
    <>
      <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'var(--bg-color)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isHome && (
              <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>
                <ChevronLeft size={20} />
              </button>
            )}
            <Link to="/" className="logo">OneNight</Link>
          </div>
          <div className="nav-actions">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
              {country ? `Регион: ${country.toUpperCase()}` : 'Международный'}
            </span>
          </div>
        </div>
      </nav>

      <main className="main-content container">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/model/:code" element={<ModelProfile />} />
        </Routes>
      </main>

      <button
        onClick={openSupport}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-color)',
          color: 'var(--bg-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(255, 59, 48, 0.4)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 90
        }}
        aria-label="Служба поддержки"
      >
        <MessageCircle size={28} />
      </button>

      <BottomSheet
        isOpen={isSupportOpen}
        onClose={closeSupport}
        title="Служба поддержки"
      >
        <div style={{ padding: '0' }}>
          {globalThreadId ? (
            <SupportChat threadId={globalThreadId} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка чата...</div>
          )}
        </div>
      </BottomSheet>

      {/* Username Prompt Modal */}
      {isUsernamePromptOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            backgroundColor: 'var(--card-glass)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <h3 className="modal-title" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Ваш Telegram</h3>
            <p className="modal-desc" style={{ textAlign: 'center' }}>
              Укажите ваш Telegram username для связи с оператором поддержки.
            </p>
            <input
              type="text"
              className="input"
              placeholder="@username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsUsernamePromptOpen(false)} style={{ flex: 1 }}>Отмена</button>
              <button className="btn" onClick={submitUsername} disabled={usernameInput.length < 2} style={{ flex: 1 }}>Продолжить</button>
            </div>
          </div>
        </div>
      )}
      
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2rem 0', marginTop: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
        <div className="container">
          <p>© {new Date().getFullYear()} OneNight. Все права защищены.</p>
        </div>
      </footer>
    </>
  );
}

export default App;
