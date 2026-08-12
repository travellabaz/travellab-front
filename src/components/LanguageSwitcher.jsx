import { Link, useLocation } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { getLocaleFromPathname, buildLocalizedPath } from '../utils/locale';

const LABELS = { az: 'AZ', ru: 'RU', en: 'EN' };

export default function LanguageSwitcher({ className }) {
  const location = useLocation();
  const current = getLocaleFromPathname(location.pathname);

  return (
    <div className={'tl-lang-switcher' + (className ? ' ' + className : '')}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <Link
          key={lang}
          to={buildLocalizedPath(location.pathname, lang) + location.search}
          className={'tl-lang-switcher-opt' + (lang === current ? ' active' : '')}
          aria-current={lang === current ? 'true' : undefined}
        >
          {LABELS[lang]}
        </Link>
      ))}
    </div>
  );
}
