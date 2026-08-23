import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';

const OTP_SECONDS = 120;
const PROMPT_DELAY_MS = 7000;
const SHOWN_KEY = 'tl_phone_prompt_shown';

function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  const start = (seconds) => {
    clearInterval(intervalRef.current);
    setSecondsLeft(seconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 0) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const label = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  return { secondsLeft, label, start };
}

const emptyOtp = () => Array(6).fill('');

// Nudges Google/mail sign-ups (no phone on file, see GoogleAuthService on
// the backend) to add a WhatsApp-reachable number — that's what lets them
// receive their referral-link SMS, which otherwise silently never arrives.
// Shown once per browser tab session (sessionStorage, not localStorage —
// a fresh tab or the next day tries again as long as profile.phone is
// still empty), a short delay after load, and is always dismissible.
export default function AddPhoneModal() {
  const { t } = useTranslation();
  const { isAuthenticated, profile, refreshProfile } = useAuth();

  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('phone'); // phone | otp | success
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState(emptyOtp);
  const otpRefs = useRef([]);
  const sessionIdRef = useRef(null);
  const countdown = useCountdown();

  useEffect(() => {
    if (!isAuthenticated || profile?.phone) return undefined;
    if (sessionStorage.getItem(SHOWN_KEY)) return undefined;
    const timer = setTimeout(() => {
      sessionStorage.setItem(SHOWN_KEY, '1');
      setOpen(true);
    }, PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, profile]);

  if (!open) return null;

  const close = () => setOpen(false);

  const submitPhone = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return setMsg(t('addPhone.errorPhoneRequired'));
    setMsg('');
    setLoading(true);
    try {
      const { ok, data } = await authApi.requestPhoneLink(digits);
      if (ok) {
        sessionIdRef.current = data.sessionId;
        setOtpDigits(emptyOtp());
        setPage('otp');
        countdown.start(OTP_SECONDS);
      } else {
        setMsg(data.message || t('addPhone.errorGeneric'));
      }
    } catch {
      setMsg(t('addPhone.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) return setMsg(t('addPhone.errorOtpLength'));
    setMsg('');
    setLoading(true);
    try {
      const { ok, data } = await authApi.confirmPhoneLink(sessionIdRef.current, code);
      if (ok) {
        await refreshProfile();
        setPage('success');
      } else {
        setMsg(data.message || t('addPhone.errorGeneric'));
        setOtpDigits(emptyOtp());
        otpRefs.current[0]?.focus();
      }
    } catch {
      setMsg(t('addPhone.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const onOtpInput = (i, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[i] = digit;
    setOtpDigits(next);
    if (digit) {
      if (i < 5) otpRefs.current[i + 1]?.focus();
      else setTimeout(submitOtp, 80);
    }
  };

  const onOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      const next = [...otpDigits];
      next[i - 1] = '';
      setOtpDigits(next);
      otpRefs.current[i - 1]?.focus();
    }
  };

  const resend = async () => {
    await authApi.requestPhoneLink(phone.replace(/\D/g, ''));
    setOtpDigits(emptyOtp());
    otpRefs.current[0]?.focus();
    countdown.start(OTP_SECONDS);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(13,21,32,0.88)',
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--tl-white)',
          border: '1px solid var(--tl-gray-200)',
          boxShadow: 'var(--tl-shadow)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 420,
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '56px 36px 36px',
          position: 'relative',
          margin: 16,
          animation: 'authPop 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both',
        }}
      >
        <button
          onClick={close}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'var(--tl-gray-100)',
            border: 'none',
            borderRadius: 8,
            width: 30,
            height: 30,
            color: 'var(--tl-navy)',
            fontSize: 18,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {page === 'phone' && (
          <div className="am-page active">
            <div className="am-title">{t('addPhone.title')}</div>
            <div className="am-sub">{t('addPhone.desc')}</div>
            {msg && <div className="am-msg er show">{msg}</div>}
            <div className="am-group">
              <label className="am-label">{t('addPhone.phoneLabel')}</label>
              <div className="am-ph-row">
                <div className="am-prefix">🇦🇿 +994</div>
                <input
                  className="am-input"
                  type="tel"
                  placeholder={t('auth.phonePlaceholder')}
                  maxLength={9}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <button className={'am-btn' + (loading ? ' ld' : '')} disabled={loading} onClick={submitPhone}>
              <span className="bt">{t('addPhone.submit')}</span>
              <div className="sp" />
            </button>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button className="am-link" onClick={close}>{t('addPhone.later')}</button>
            </div>
          </div>
        )}

        {page === 'otp' && (
          <div className="am-page active">
            <button className="am-back" onClick={() => setPage('phone')}>{t('auth.back')}</button>
            <div className="am-title">{t('addPhone.otpTitle')}</div>
            <div className="am-sub">{t('addPhone.otpDesc', { phone })}</div>
            {msg && <div className="am-msg er show">{msg}</div>}
            <div className="am-otp-row">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  className={'am-otp-cell' + (digit ? ' fl' : '')}
                  maxLength={1}
                  type="tel"
                  value={digit}
                  onChange={(e) => onOtpInput(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                />
              ))}
            </div>
            <div className="am-timer">
              {t('auth.otpTimer')} <strong>{countdown.label}</strong>
            </div>
            <button className={'am-btn' + (loading ? ' ld' : '')} disabled={loading} onClick={submitOtp}>
              <span className="bt">{t('addPhone.submit')}</span>
              <div className="sp" />
            </button>
            <div style={{ textAlign: 'center', marginTop: 11 }}>
              <span style={{ fontSize: 12, color: 'rgba(29,41,57,.45)' }}>{t('auth.otpNotReceived')} </span>
              <button className="am-link" disabled={countdown.secondsLeft > 0} onClick={resend}>{t('auth.resend')}</button>
            </div>
          </div>
        )}

        {page === 'success' && (
          <div className="am-page active">
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div className="am-si">✓</div>
              <div className="am-title" style={{ textAlign: 'center' }}>{t('addPhone.successTitle')}</div>
              <p className="am-sub" style={{ textAlign: 'center', marginBottom: 22 }}>{t('addPhone.successDesc')}</p>
              <button className="am-btn" onClick={close}>
                <span className="bt">{t('addPhone.close')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
