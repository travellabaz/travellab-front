import { useEffect } from 'react';
import { useModals } from '../context/ModalContext';
import PrivacyContent from '../components/PrivacyContent';

export default function PrivacyModal() {
  const { privacyOpen, closePrivacy } = useModals();

  useEffect(() => {
    if (!privacyOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closePrivacy();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [privacyOpen, closePrivacy]);

  if (!privacyOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closePrivacy();
      }}
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        // Above the story viewer (.tl-story-viewer, z-index:3000) — same
        // bug class fixed in AuthModal/ManagerContactModal: opened from
        // inside it (AuthModal's register form links here), this
        // rendered but was completely hidden behind it.
        zIndex: 3500,
        background: 'rgba(13,21,32,0.92)',
        backdropFilter: 'blur(8px)',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--tl-white)',
          border: '1px solid var(--tl-gray-200)',
          boxShadow: 'var(--tl-shadow)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 720,
          padding: 40,
          position: 'relative',
          margin: '20px auto',
          animation: 'authPop 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both',
        }}
      >
        <button
          onClick={closePrivacy}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'var(--tl-gray-100)',
            border: 'none',
            borderRadius: 8,
            width: 32,
            height: 32,
            color: 'var(--tl-navy)',
            fontSize: 20,
            cursor: 'pointer',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
        <PrivacyContent />
      </div>
    </div>
  );
}
