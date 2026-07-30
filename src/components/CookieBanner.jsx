import { useEffect, useState } from 'react';
import { useModals } from '../context/ModalContext';

function getCookie(name) {
  return document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + '='))
    ?.slice(name.length + 1);
}

function setCookie(name, value) {
  const d = new Date();
  d.setTime(d.getTime() + 31536000000);
  const host = window.location.hostname.split('.');
  const domain = host.length > 3 ? '.' + host.slice(-3).join('.') : host.length > 1 ? '.' + host.slice(-2).join('.') : window.location.hostname;
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;domain=${domain}`;
}

// React port of the Travelpayouts cookie-consent banner (originally
// [:cookie_policy_script:], auto-injected by their hosting).
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { openPrivacy } = useModals();

  useEffect(() => {
    setVisible(getCookie('tpwl_cookie_accepted') !== 'true');
  }, []);

  if (!visible) return null;

  return (
    <div className="tpwl-cookie-banner" id="tpwl-cookie-banner" style={{ display: 'flex' }}>
      <div className="tpwl-cookie-banner__logo" />
      <div className="tpwl-cookie-banner__text">
        To provide a better experience we use cookies to store your search history and selected filters. By clicking
        or navigating the site, you agree to allow our collection of information through cookies.
      </div>
      <div className="tpwl-cookie-banner__actions">
        <button
          className="tpwl-cookie-banner__base-button tpwl-cookie-banner__accept"
          onClick={() => {
            setCookie('tpwl_cookie_accepted', 'true');
            setVisible(false);
          }}
        >
          Accept
        </button>
        <a
          className="tpwl-cookie-banner__base-button tpwl-cookie-banner__link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            openPrivacy();
          }}
        >
          Cookies Policy
        </a>
      </div>
    </div>
  );
}
