import { useEffect } from 'react';
import { useModals } from '../context/ModalContext';

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
        zIndex: 2000,
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
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(4,149,72,0.1)',
            border: '1px solid rgba(4,149,72,0.25)',
            borderRadius: 100,
            padding: '4px 14px',
            fontSize: 11,
            color: 'var(--tl-green)',
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Gizlilik Siyasəti
        </div>
        <h2 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 6, letterSpacing: '-0.5px' }}>
          Gizlilik Siyasəti – Travellab
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(29,41,57,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
          Travellab, sizin şəxsi məlumatlarınızın məxfiliyini qorumağa sadiqdir. Bu Gizlilik Siyasəti,{' '}
          <a href="https://www.travellab.az" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tl-green)' }}>
            www.travellab.az
          </a>{' '}
          saytına daxil olduğunuz zaman toplanan məlumatların necə istifadə edildiyi və qorunduğunu izah edir.
        </p>

        <div className="pv-section">
          <div className="pv-h">Gizlilik Öhdəliyimiz</div>
          <ul className="pv-ul">
            <li>Müştərilərimizin bizimlə paylaşdığı məlumatları yüksək təhlükəsizlik standartlarına əsasən qoruyacağıq.</li>
            <li>Şəxsi məlumatların toplanması yalnız xidmətlərimizi göstərmək məqsədi ilə məhdudlaşdırılacaq.</li>
            <li>Müştəri məlumatlarına yalnız səlahiyyətli əməkdaşlarımızın çıxışı olacaq.</li>
            <li>Müştəri məlumatlarını heç bir xarici təşkilata, əvvəlcədən xəbərdarlıq etmədən açıqlamayacağıq.</li>
            <li>Dəstək tərəfdaşlarımızın məxfilik standartlarına riayət etmələrini təmin edəcəyik.</li>
            <li>İstifadəçilərə öz məlumatlarına çıxış və düzəliş etmək imkanı yaradacağıq.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">Topladığımız Məlumatlar</div>
          <p className="pv-p"><strong style={{ color: 'var(--tl-navy)' }}>Şəxsi Məlumatlar:</strong></p>
          <ul className="pv-ul">
            <li>Ad, soyad</li>
            <li>Ünvan</li>
            <li>Telefon nömrəsi</li>
            <li>E-poçt ünvanı</li>
            <li>Kompüterinizə dair texniki məlumatlar</li>
          </ul>
          <div className="pv-note">⚠️ 13 yaşından kiçik uşaqlardan şəxsi məlumat toplanmır. 18 yaşdan aşağı istifadəçilərin valideyn razılığı olmadan məlumat verməsi qadağandır.</div>
          <p className="pv-p" style={{ marginTop: 12 }}>
            <strong style={{ color: 'var(--tl-navy)' }}>Saytdan İstifadə Məlumatları:</strong> Saytımıza daxil olduğunuz zaman IP ünvanınız və vebsaytdakı davranışlarınız avtomatik toplanır.
          </p>
        </div>

        <div className="pv-section">
          <div className="pv-h">Məlumatlardan Necə İstifadə Edirik</div>
          <ul className="pv-ul">
            <li>Xidmətlərimizin təmin edilməsi və təkmilləşdirilməsi</li>
            <li>Yeni məhsul və xidmətlər barədə sizə məlumat göndərmək</li>
            <li>Saytın və reklamların fərdiləşdirilməsi</li>
            <li>İstifadəçi təcrübəsinin təhlili və təkmilləşdirilməsi</li>
            <li>Hüquqi tələblərə uyğun hərəkət etmək</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">Çərəzlər (Cookies)</div>
          <p className="pv-p">Saytımızda çərəzlərdən istifadə olunur. Bu texnologiya istifadəçilərin təcrübəsini yaxşılaşdırmaq məqsədi daşıyır. Çərəzləri istədiyiniz zaman brauzerinizin ayarlarından deaktiv edə bilərsiniz.</p>
        </div>

        <div className="pv-section">
          <div className="pv-h">Təhlükəsizlik</div>
          <p className="pv-p">Topladığımız şəxsi məlumatlar təhlükəsiz serverlərdə saxlanılır və icazəsiz girişə qarşı qorunur.</p>
        </div>

        <div className="pv-section">
          <div className="pv-h">Beynəlxalq Məlumat Transferi</div>
          <p className="pv-p">İnternetin qlobal təbiətinə görə, məlumatların beynəlxalq ötürülməsi mümkündür. Saytımızdan istifadə etməklə bu cür ötürmələrə razılığınızı vermiş olursunuz.</p>
        </div>

        <div className="pv-section">
          <div className="pv-h">Gizlilik Siyasətində Dəyişikliklər</div>
          <p className="pv-p">Bu Gizlilik Siyasəti zaman-zaman yenilənə bilər. Dəyişikliklər bu səhifədə dərc olunacaq. Əgər dəyişikliklər əvvəl təqdim etdiyiniz məlumatların istifadəsinə əhəmiyyətli təsir göstərərsə, razılığınız ayrıca alınacaq.</p>
        </div>

        <div className="pv-section" style={{ marginBottom: 0 }}>
          <div className="pv-h">Əlaqə</div>
          <div className="pv-contact">
            <span style={{ fontSize: 20 }}>📧</span>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(29,41,57,0.5)', marginBottom: 2 }}>Sual və narahatlıqlarınız üçün:</div>
              <a href="mailto:info@travellab.az">info@travellab.az</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
