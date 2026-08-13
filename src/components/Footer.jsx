import { useTranslation } from 'react-i18next';
import Link from './LocalizedLink';
import LogoFull from './LogoFull';
import { useModals } from '../context/ModalContext';

// Decorative footer icons — exact paths from the Figma footer (provided
// directly by the user), framed via viewBox rather than re-based to 0,0
// so the path data stays byte-for-byte identical to the source.
function FlowerIcon() {
  return (
    <svg width="34" height="18" viewBox="935 725 65 35" fill="none">
      <path d="M949.779 757.2C949.779 759.4 953.179 759.4 953.179 757.2C953.179 749.1 959.679 742.5 967.779 742.5C975.879 742.5 982.479 749.1 982.479 757.2C982.479 759.4 985.879 759.4 985.879 757.2C985.879 747.3 977.779 739.2 967.779 739.2C957.879 739.2 949.779 747.3 949.779 757.2Z" fill="white" />
      <path d="M974.68 756C974.78 756.9 975.48 757.4 976.38 757.4C980.38 757.4 976.58 746.9 967.78 746.9C959.58 746.9 955.38 756.6 958.98 757.3C959.88 757.4 960.78 756.8 960.98 755.9C962.38 748.3 973.38 748.4 974.68 756Z" fill="white" />
      <path d="M966.18 729.7V733.9C966.18 736.1 969.48 736.1 969.48 733.9V729.7C969.48 728.8 968.78 728 967.78 728C966.88 728 966.18 728.8 966.18 729.7Z" fill="white" />
      <path d="M990.179 754.3C988.679 754.5 988.279 756.5 989.479 757.3C990.279 757.8 990.479 757.6 994.879 756.8C997.079 756.4 996.479 753.1 994.279 753.5L990.179 754.3Z" fill="white" />
      <path d="M945.48 754.3C940.98 753.5 940.78 753.3 940.08 753.8C938.88 754.6 939.28 756.5 940.68 756.8L944.88 757.6C947.08 758 947.68 754.7 945.48 754.3Z" fill="white" />
      <path d="M983.179 739.6C981.579 741.1 983.979 743.5 985.479 741.9L988.479 738.9C990.079 737.4 987.679 735 986.179 736.6L983.179 739.6Z" fill="white" />
      <path d="M952.58 739.6L949.58 736.6C947.98 735 945.68 737.4 947.18 738.9C950.38 742.1 950.48 742.4 951.38 742.4C952.88 742.4 953.68 740.6 952.58 739.6Z" fill="white" />
      <path d="M987.179 748.4C987.579 750.2 989.679 750.8 990.879 749.6C992.379 748 990.979 745.4 988.879 745.9C987.679 746.1 986.979 747.3 987.179 748.4Z" fill="white" />
      <path d="M948.48 747.8C948.18 746.4 946.78 745.7 945.48 746.2C943.08 747.2 944.079 750.9 946.779 750.4C947.979 750.1 948.68 749 948.48 747.8Z" fill="white" />
      <path d="M961.079 735.6C961.079 734.2 959.779 733.1 958.379 733.4C957.079 733.7 956.279 735.1 956.779 736.4C957.679 738.6 961.079 737.9 961.079 735.6Z" fill="white" />
      <path d="M977.08 737.6C979.98 737 978.98 732.8 976.28 733.3C973.38 733.9 974.18 738.2 977.08 737.6Z" fill="white" />
    </svg>
  );
}

function NavyWaveIcon() {
  return (
    <svg width="34" height="17" viewBox="306 725 67 34" fill="none">
      <path d="M343.289 741.537C340.989 743.737 338.189 743.937 335.889 741.837C334.989 740.937 331.989 737.137 327.489 737.237C324.889 737.337 322.389 738.737 319.789 741.437C318.089 743.337 320.889 745.937 322.589 744.037C327.889 738.437 330.289 741.937 333.289 744.637C337.089 748.137 342.189 747.837 345.989 744.437C346.889 743.537 348.889 740.837 351.389 741.037C354.989 741.337 356.589 746.237 358.889 743.837C359.589 743.137 359.589 741.837 358.789 741.137C356.489 738.837 354.189 737.337 351.689 737.137C347.189 736.837 344.389 740.537 343.289 741.537Z" fill="#304872" />
      <path d="M367.389 732.037C365.789 734.637 361.489 734.737 359.289 732.537C354.089 727.137 348.989 726.137 343.889 731.837C341.389 734.637 337.989 735.037 335.389 732.137C330.389 726.737 325.089 726.637 319.789 732.337C317.589 734.737 313.189 734.737 311.589 732.037C310.189 729.837 306.989 731.937 308.289 734.037C311.289 739.037 318.689 739.137 322.589 734.937C326.389 731.037 328.989 731.037 332.489 734.737C336.589 739.237 342.589 739.037 346.789 734.437C350.189 730.637 352.689 731.237 356.589 735.237C360.689 739.237 367.789 738.737 370.689 734.037C371.989 731.937 368.789 729.837 367.389 732.037Z" fill="#304872" />
      <path d="M343.289 750.637C340.989 752.837 338.189 753.037 335.889 750.937C335.289 750.437 333.889 748.637 331.589 747.437C329.189 746.137 325.589 745.637 325.589 748.337C325.689 749.437 326.589 750.237 327.589 750.237C330.189 750.137 332.289 752.937 333.289 753.737C337.089 757.237 342.189 757.037 345.989 753.537C346.889 752.637 348.789 750.037 351.189 750.137C352.289 750.137 353.189 749.337 353.189 748.337C353.289 745.637 349.889 745.937 347.489 747.237C345.389 748.337 344.089 750.037 343.289 750.637Z" fill="#304872" />
    </svg>
  );
}

function GreenLinesIcon() {
  return (
    <svg width="25" height="17" viewBox="1114 727 38 26" fill="none">
      <path d="M1149.86 730.7H1116.66C1115.86 730.7 1115.26 730.1 1115.26 729.3C1115.26 728.6 1115.86 728 1116.66 728H1149.86C1150.56 728 1151.16 728.6 1151.16 729.3C1151.16 730.1 1150.56 730.7 1149.86 730.7Z" fill="#049548" />
      <path d="M1149.86 740.9H1116.66C1115.86 740.9 1115.26 740.3 1115.26 739.5C1115.26 738.7 1115.86 738.1 1116.66 738.1H1149.86C1150.56 738.1 1151.16 738.7 1151.16 739.5C1151.16 740.3 1150.56 740.9 1149.86 740.9Z" fill="#049548" />
      <path d="M1149.86 750.9H1116.66C1115.86 750.9 1115.26 750.3 1115.26 749.5C1115.26 748.8 1115.86 748.2 1116.66 748.2H1149.86C1150.56 748.2 1151.16 748.8 1151.16 749.5C1151.16 750.3 1150.56 750.9 1149.86 750.9Z" fill="#049548" />
    </svg>
  );
}

function BlueWaveIcon() {
  return (
    <svg width="20" height="20" viewBox="729 778 33 33" fill="none">
      <path d="M747.944 810.61C747.144 810.61 746.444 810.01 746.244 809.21C745.344 803.81 747.044 798.91 751.044 794.91C751.111 794.843 751.177 794.776 751.244 794.71C756.144 791.41 758.944 785.91 758.244 781.01C758.044 780.01 758.744 779.21 759.644 779.01C760.644 778.91 761.444 779.61 761.644 780.51C762.544 786.81 759.244 793.41 753.344 797.41C750.144 800.61 748.944 804.41 749.644 808.61C749.844 809.51 749.144 810.41 748.244 810.61C748.177 810.61 748.077 810.61 747.944 810.61Z" fill="#0774BA" />
      <path d="M730.944 810.61C730.044 810.61 729.344 810.01 729.244 809.21C728.344 803.81 729.944 798.91 733.944 794.91C734.01 794.843 734.11 794.776 734.244 794.71C739.044 791.41 741.844 785.91 741.144 781.01C741.044 780.01 741.644 779.21 742.644 779.01C743.544 778.91 744.444 779.61 744.544 780.51C745.444 786.81 742.144 793.41 736.244 797.41C733.144 800.61 731.844 804.41 732.544 808.61C732.744 809.51 732.144 810.41 731.144 810.61C731.077 810.61 731.01 810.61 730.944 810.61Z" fill="#0774BA" />
      <path d="M739.444 810.61C738.644 810.61 737.844 810.01 737.744 809.21C736.844 803.81 738.544 798.91 742.444 794.91C742.577 794.843 742.677 794.776 742.744 794.71C747.644 791.41 750.444 785.91 749.644 781.01C749.544 780.01 750.244 779.21 751.144 779.01C752.044 778.91 752.944 779.61 753.044 780.51C753.944 786.81 750.744 793.41 744.744 797.41C741.644 800.61 740.444 804.41 741.144 808.61C741.244 809.51 740.644 810.41 739.744 810.61C739.61 810.61 739.51 810.61 739.444 810.61Z" fill="#0774BA" />
    </svg>
  );
}

function NavyDripIcon() {
  return (
    <svg width="16" height="33" viewBox="486 693 33 68" fill="none">
      <path d="M503.54 723.698C505.64 725.998 505.84 728.798 503.74 731.098C502.94 731.998 499.14 734.998 499.24 739.498C499.34 742.098 500.74 744.598 503.44 747.198C505.24 748.898 507.94 746.098 506.04 744.398C500.44 739.098 503.94 736.698 506.64 733.698C510.14 729.898 509.84 724.798 506.34 721.098C505.44 720.098 502.84 718.098 503.04 715.598C503.34 711.998 508.14 710.398 505.84 708.098C505.04 707.398 503.84 707.398 503.14 708.198C500.84 710.498 499.34 712.798 499.14 715.298C498.74 719.798 502.54 722.598 503.54 723.698Z" fill="#304872" />
      <path d="M494.04 699.598C496.54 701.198 496.74 705.498 494.44 707.698C489.14 712.898 488.14 717.998 493.84 723.098C496.64 725.598 497.04 728.998 494.14 731.598C488.74 736.598 488.64 741.898 494.24 747.198C496.64 749.398 496.74 753.798 494.04 755.398C491.84 756.798 493.84 760.098 496.04 758.698C500.94 755.698 501.14 748.298 496.94 744.398C492.94 740.598 492.94 737.998 496.74 734.498C501.14 730.398 501.04 724.398 496.44 720.298C492.64 716.798 493.24 714.298 497.14 710.398C501.24 706.398 500.74 699.198 496.04 696.298C493.94 694.998 491.84 698.298 494.04 699.598Z" fill="#304872" />
      <path d="M512.64 723.698C514.84 725.998 515.04 728.798 512.94 731.098C512.44 731.698 510.54 733.198 509.34 735.398C508.04 737.798 507.64 741.398 510.34 741.398C511.44 741.298 512.24 740.398 512.24 739.398C512.14 736.798 514.94 734.698 515.74 733.698C519.24 729.898 518.94 724.798 515.54 721.098C514.64 720.098 512.04 718.198 512.14 715.798C512.14 714.698 511.34 713.798 510.24 713.798C507.64 713.698 507.94 717.098 509.14 719.498C510.34 721.598 512.04 722.898 512.64 723.698Z" fill="#304872" />
    </svg>
  );
}

// Exact counts from the source: 2 flowers, 1 navy ribbon, 4 green-lines,
// 4 blue-waves, 3 navy-drips — matches the real pattern one-for-one
// instead of an arbitrary repeat.
const FOOTER_ICONS = [FlowerIcon, NavyWaveIcon, GreenLinesIcon, BlueWaveIcon, NavyDripIcon];

export default function Footer() {
  const { openPrivacy, openTerms, openAuth } = useModals();
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="tl-footer">
      <div className="tl-footer-inner">
        <div className="tl-footer-top">
          <div className="tl-footer-brand">
            <Link to="/" className="tl-logo" style={{ marginBottom: 0 }}>
              <LogoFull style={{ height: 24, width: 'auto' }} />
            </Link>
            <p>{t('footer.tagline')}</p>
            <div className="tl-footer-membership">
              <span className="tl-footer-membership-label">{t('footer.member')}</span>
              <a href="https://ataa.az/" target="_blank" rel="noopener noreferrer" aria-label="Azərbaycan Turizm Agentlikləri Assosiasiyası">
                <img
                  src="/images/partners/aztaa-logo.jpeg"
                  alt="Azərbaycan Turizm Agentlikləri Assosiasiyası (AZTAA)"
                  className="tl-footer-membership-logo"
                />
              </a>
            </div>
            <a
              href="https://www.google.com/search?q=travellab+az#lrd=0x6ddb39431b5ebc71:0x4fae5a1248077495,1,,,,"
              target="_blank"
              rel="noopener noreferrer"
              className="tl-footer-rating"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1C3.24 21.3 7.28 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.3A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.3v-3.1H1.27A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.27 5.4l4-3.1z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.27 6.6l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
              </svg>
              <span className="tl-footer-rating-score">5.0</span>
              <span className="tl-footer-rating-stars" aria-hidden="true">★★★★★</span>
            </a>
          </div>

          <div className="tl-footer-cols">
            <div className="tl-footer-col">
              <div className="tl-footer-col-title">{t('footer.company')}</div>
              <Link to="/about">{t('footer.about')}</Link>
              <Link to="/blog?category=X%C9%99b%C9%99rl%C9%99r">{t('footer.news')}</Link>
              <Link to="/blog">{t('footer.blog')}</Link>
              <Link to="/hediyye-karti">{t('footer.giftCard')}</Link>
              <Link to="/korporativ">{t('footer.corporate')}</Link>
            </div>
            <div className="tl-footer-col">
              <div className="tl-footer-col-title">{t('footer.account')}</div>
              <a href="#" onClick={(e) => { e.preventDefault(); openAuth('login'); }}>{t('footer.login')}</a>
              <a href="#" onClick={(e) => { e.preventDefault(); openAuth('register'); }}>{t('footer.register')}</a>
            </div>
            <div className="tl-footer-col">
              <div className="tl-footer-col-title">{t('footer.legal')}</div>
              <a href="#" onClick={(e) => { e.preventDefault(); openPrivacy(); }}>{t('footer.privacy')}</a>
              <a href="#" onClick={(e) => { e.preventDefault(); openTerms(); }}>{t('footer.terms')}</a>
              <a href="mailto:info@travellab.az">{t('footer.contact')}</a>
            </div>
          </div>
        </div>

        <div className="tl-footer-contact">
          <div>
            <div className="tl-footer-contact-label">{t('footer.mailAddress')}</div>
            <div className="tl-footer-contact-value">
              <a href="mailto:info@travellab.az">info@travellab.az</a>
            </div>
          </div>
          <div>
            <div className="tl-footer-contact-label">{t('footer.address')}</div>
            <div className="tl-footer-contact-value">{t('footer.addressValue')}</div>
          </div>
          <div>
            <div className="tl-footer-contact-label">{t('footer.socialNetworks')}</div>
            <div className="tl-footer-social">
              <a href="https://www.facebook.com/travellab.az/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.98 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5z" /></svg>
              </a>
              <a href="https://www.linkedin.com/company/travellab-azerbaijan/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.4 8.75h3.1V21H3.4V8.75zm6.2 0h2.97v1.68h.04c.41-.78 1.43-1.6 2.94-1.6 3.14 0 3.72 2.07 3.72 4.76V21h-3.1v-5.44c0-1.3-.02-2.97-1.81-2.97-1.82 0-2.1 1.42-2.1 2.88V21H9.6V8.75z" /></svg>
              </a>
              <a href="https://www.instagram.com/travellab.az/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
              </a>
              <a href="https://www.tiktok.com/@travellab.az" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82c-.6-.66-.96-1.5-1-2.42h-3.14v13.3c0 1.4-1.13 2.53-2.53 2.53a2.53 2.53 0 0 1-.98-4.87 2.53 2.53 0 0 1 1.68-.13V11.1a5.7 5.7 0 0 0-.7-.05A5.73 5.73 0 1 0 15.6 16.7V9.02a8.16 8.16 0 0 0 4.75 1.52V7.4a4.85 4.85 0 0 1-3.75-1.58z" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="tl-footer-waves" aria-hidden="true">
          <div className="tl-fw-row">
            {[0, 1, 4, 2, 4, 0, 2, 3].map((i, idx) => {
              const Icon = FOOTER_ICONS[i];
              return <Icon key={idx} />;
            })}
          </div>
          <div className="tl-fw-row tl-fw-row-offset">
            {[2, 3, 4, 3, 2, 3].map((i, idx) => {
              const Icon = FOOTER_ICONS[i];
              return <Icon key={idx} />;
            })}
          </div>
        </div>

        <div className="tl-footer-bottom">
          <span>© {year} Travellab. {t('footer.rights')}</span>
          <span>🇦🇿 {t('footer.city')}</span>
        </div>
      </div>
    </footer>
  );
}
