import PrivacyContent from '../components/PrivacyContent';

// the privacy policy on its own address, for Meta and the search engines
export default function PrivacyPage() {
  return (
    <main className="tpwl-main">
      <div
        style={{
          background: 'var(--tl-white)',
          border: '1px solid var(--tl-gray-200)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 760,
          padding: 'clamp(20px, 5vw, 40px)',
          margin: '32px auto',
        }}
      >
        <PrivacyContent />
      </div>
    </main>
  );
}
