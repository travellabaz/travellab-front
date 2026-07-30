import { useEffect } from 'react';
import { useModals } from '../context/ModalContext';

export default function TermsModal() {
  const { termsOpen, closeTerms } = useModals();

  useEffect(() => {
    if (!termsOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeTerms();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [termsOpen, closeTerms]);

  if (!termsOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeTerms();
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
          onClick={closeTerms}
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
          İstifadə Şərtləri
        </div>
        <h2 style={{ fontFamily: "'Geist Sans', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--tl-navy)', marginBottom: 6, letterSpacing: '-0.5px' }}>
          İstifadə Şərtləri və Qaydalar – Travellab
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(29,41,57,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
          Bu İstifadə Şərtləri və Qaydalar ("Şərtlər") Travellab platformasından (
          <a href="https://www.travellab.az" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tl-green)' }}>
            www.travellab.az
          </a>
          ) və onun xidmətlərindən istifadəni tənzimləyir. Saytımıza daxil olaraq və ya xidmətlərimizdən istifadə
          edərək, bu şərtləri qəbul etmiş sayılırsınız. Əgər bu şərtlərlə razı deyilsinizsə, xahiş edirik saytdan
          istifadə etməyin.
        </p>

        <div className="pv-section">
          <div className="pv-h">1. Ümumi Qaydalar</div>
          <ul className="pv-ul">
            <li>Travellab, istifadəçilərə uçuş, otel, tur və digər səyahət xidmətlərinə dair axtarış və məlumat təqdim edən platformadır.</li>
            <li>Saytdakı bütün məzmun və funksiyalar yalnız qanuni məqsədlərlə istifadə edilə bilər.</li>
            <li>İstifadəçi təqdim etdiyi bütün məlumatların düzgün və doğru olduğunu təsdiqləyir.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">2. İstifadəçi Qeydiyyatı və Hesablar</div>
          <ul className="pv-ul">
            <li>Bəzi xidmətlərə giriş üçün qeydiyyat tələb oluna bilər.</li>
            <li>Qeydiyyat zamanı təqdim edilən məlumatlar doğru və güncəl olmalıdır.</li>
            <li>Hesabınızın təhlükəsizliyindən siz məsulsunuz. Şifrə və giriş məlumatlarını üçüncü şəxslərlə paylaşmaq qadağandır.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">3. Məxfilik və Məlumatların Qorunması</div>
          <ul className="pv-ul">
            <li>İstifadəçilər tərəfindən təqdim edilən şəxsi məlumatlar Gizlilik Siyasəti çərçivəsində qorunur.</li>
            <li>Travellab, şəxsi məlumatları yalnız xidmətlərin göstərilməsi və təkmilləşdirilməsi məqsədi ilə istifadə edir.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">4. Xidmətlərin İstifadəsi</div>
          <ul className="pv-ul">
            <li>Saytda yerləşdirilən qiymət və məlumatlar arayış xarakterlidir, son qiymət ödəniş anında təsdiqlənir.</li>
            <li>Xidmətlərdən sui-istifadə halları (spam, zərərli proqram yaymaq, sistemə müdaxilə və s.) qəti şəkildə qadağandır.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">5. Mülkiyyət Hüquqları</div>
          <ul className="pv-ul">
            <li>Saytdakı bütün məzmun (mətnlər, loqolar, dizayn, proqram təminatı və s.) Travellab və ya onun tərəfdaşlarına məxsusdur.</li>
            <li>Heç bir məzmun yazılı icazə olmadan kopyalana, yayıla və ya dəyişdirilə bilməz.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">6. Məsuliyyətin Məhdudlaşdırılması</div>
          <ul className="pv-ul">
            <li>Travellab, xidmətlərdən istifadə nəticəsində yaranan birbaşa və ya dolayı zərərlərə görə məsuliyyət daşımır.</li>
            <li>Texniki nasazlıq, məlumat itkisi və ya saytın mövcud olmaması hallarında Travellab məsuliyyət qəbul etmir.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">7. Üçüncü Tərəf Linkləri</div>
          <ul className="pv-ul">
            <li>Saytımızda digər vebsaytlara (o cümlədən tərəfdaş axtarış/bron xidmətlərinə) keçidlər ola bilər. Bu saytların məzmununa və siyasətlərinə görə Travellab məsuliyyət daşımır.</li>
            <li>Bu linklər yalnız istifadəçi rahatlığı üçün təqdim olunur.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">8. Dəyişikliklər</div>
          <ul className="pv-ul">
            <li>Travellab bu şərtləri istənilən vaxt dəyişmək hüququnu özündə saxlayır.</li>
            <li>Dəyişikliklər saytımızda yerləşdirildiyi andan etibarən qüvvəyə minir. İstifadənin davam etdirilməsi bu dəyişikliklərin qəbul edildiyi anlamına gəlir.</li>
          </ul>
        </div>

        <div className="pv-section">
          <div className="pv-h">9. Qanunvericilik və Yurisdiksiya</div>
          <ul className="pv-ul">
            <li>Bu şərtlər Azərbaycan Respublikasının qanunvericiliyinə uyğun olaraq tənzimlənir.</li>
            <li>İstənilən mübahisə Azərbaycan məhkəmələri tərəfindən həll ediləcəkdir.</li>
          </ul>
        </div>

        <div className="pv-section" style={{ marginBottom: 0 }}>
          <div className="pv-h">10. Əlaqə</div>
          <div className="pv-contact">
            <span style={{ fontSize: 20 }}>📧</span>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(29,41,57,0.5)', marginBottom: 2 }}>İstifadə şərtləri ilə bağlı sual və ya təklifləriniz üçün:</div>
              <a href="mailto:info@travellab.az">info@travellab.az</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
