import { useEffect, useRef, useState } from 'react';
import { useModals } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';

const OTP_SECONDS = 120;
// Unset until a real Google Cloud OAuth Web Client ID is added to the env —
// the button section below simply doesn't render until then.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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

export default function AuthModal() {
  const { authOpen, authTab, closeAuth, openTerms } = useModals();
  const { loginSuccess } = useAuth();

  const [page, setPage] = useState('main'); // main | otp | fg | sp | sc
  const [tab, setTab] = useState('login'); // register | login

  const [reg, setReg] = useState({ name: '', surname: '', phone: '', mail: '', pw: '', pw2: '', terms: false });
  const [regMsg, setRegMsg] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const [showRegPw2, setShowRegPw2] = useState(false);

  const [login, setLogin] = useState({ phone: '', pw: '' });
  const [loginMsg, setLoginMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [newPw, setNewPw] = useState({ pw: '', pw2: '' });
  const [setPwMsg, setSetPwMsg] = useState('');
  const [setPwLoading, setSetPwLoading] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showNewPw2, setShowNewPw2] = useState(false);

  const [otpDigits, setOtpDigits] = useState(emptyOtp);
  const [otpMsg, setOtpMsg] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpDesc, setOtpDesc] = useState('');
  const otpRefs = useRef([]);
  const countdown = useCountdown();

  const sessionRef = useRef({ sessionId: null, phone: null, flow: null });
  const [otpBackTarget, setOtpBackTarget] = useState('main');

  const [successMsg, setSuccessMsg] = useState('');
  const [successAction, setSuccessAction] = useState(() => () => {});

  // Reset everything each time the modal is (re)opened, matching the
  // original's openAuth(): amPg('am-main'); amTab(tab).
  useEffect(() => {
    if (!authOpen) return;
    setPage('main');
    setTab(authTab || 'login');
    setRegMsg('');
    setLoginMsg('');
  }, [authOpen, authTab]);

  useEffect(() => {
    if (!authOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeAuth();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [authOpen, closeAuth]);

  // Google Identity Services — the callback below is re-registered whenever
  // `tab` changes so it always closes over the currently-visible page's
  // message setter (regMsg vs loginMsg), and the button is re-rendered into
  // whichever tab's container div is actually mounted right now.
  const googleBtnRef = useRef(null);

  const handleGoogleCredential = async (response) => {
    try {
      const { ok, data } = await authApi.googleLogin(response.credential);
      if (!ok) {
        const msg = data.message || 'Google ilə daxil olarkən xəta baş verdi.';
        (tab === 'register' ? setRegMsg : setLoginMsg)(msg);
        return;
      }
      closeAuth();
      await loginSuccess(data.tokens.accessToken, data.tokens.refreshToken);
    } catch {
      (tab === 'register' ? setRegMsg : setLoginMsg)('Şəbəkə xətası.');
    }
  };

  useEffect(() => {
    if (!authOpen || page !== 'main' || !GOOGLE_CLIENT_ID) return undefined;

    let cancelled = false;
    let attempts = 0;

    const tryInit = () => {
      if (cancelled) return;
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        });
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 380,
          text: 'continue_with',
          locale: 'az',
        });
      } else if (attempts < 25) {
        attempts += 1;
        setTimeout(tryInit, 200);
      }
    };

    tryInit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authOpen, page, tab]);

  if (!authOpen) return null;

  const goOtp = ({ sessionId, phone, flow, description, backTarget }) => {
    sessionRef.current = { sessionId, phone, flow };
    setOtpBackTarget(backTarget);
    setOtpDesc(description);
    setOtpDigits(emptyOtp());
    setOtpMsg('');
    countdown.start(OTP_SECONDS);
    setPage('otp');
  };

  const submitRegister = async () => {
    setRegMsg('');
    const { name, surname, phone, mail, pw, pw2, terms } = reg;
    if (!name || !surname || !phone || !mail || !pw) return setRegMsg('Bütün xanaları doldurun.');
    if (pw !== pw2) return setRegMsg('Şifrələr uyğun gəlmir.');
    if (pw.length < 8) return setRegMsg('Şifrə ən az 8 simvol olmalıdır.');
    if (!terms) return setRegMsg('Davam etmək üçün Qaydalar və Şərtlərlə razılaşmalısınız.');

    setRegLoading(true);
    try {
      const { ok, data } = await authApi.register({ name, surname, phone, mail, password: pw, passwordConfirm: pw2 });
      if (!ok) return setRegMsg(data.message || 'Xəta baş verdi.');
      goOtp({
        sessionId: data.sessionId,
        phone: authApi.toApiPhone(phone),
        flow: 'reg',
        description: `+994${phone} nömrəsinə WhatsApp OTP göndərildi.`,
        backTarget: 'main',
      });
    } catch {
      setRegMsg('Şəbəkə xətası.');
    } finally {
      setRegLoading(false);
    }
  };

  const submitLogin = async () => {
    setLoginMsg('');
    const { phone, pw } = login;
    if (!phone || !pw) return setLoginMsg('Bütün xanaları doldurun.');

    setLoginLoading(true);
    try {
      const { ok, data } = await authApi.login({ phone, password: pw });
      if (!ok) return setLoginMsg(data.message || 'Yanlış telefon və ya şifrə.');
      closeAuth();
      await loginSuccess(data.tokens.accessToken, data.tokens.refreshToken);
    } catch {
      setLoginMsg('Şəbəkə xətası.');
    } finally {
      setLoginLoading(false);
    }
  };

  const submitOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) return setOtpMsg('6 rəqəmli kodu daxil edin.');
    setOtpMsg('');
    setOtpLoading(true);
    try {
      const { ok, data } = await authApi.otpCheck(sessionRef.current.sessionId, code);
      if (ok) {
        countdown.start(0);
        if (sessionRef.current.flow === 'reg') {
          setSuccessMsg('Qeydiyyatınız uğurla tamamlanmışdır!');
          setSuccessAction(() => () => {
            setTab('login');
            setPage('main');
          });
          setPage('sc');
        } else {
          setPage('sp');
        }
      } else {
        setOtpMsg(data.message || 'Kod yanlışdır.');
        setOtpDigits(emptyOtp());
        otpRefs.current[0]?.focus();
      }
    } catch {
      setOtpMsg('Şəbəkə xətası.');
    } finally {
      setOtpLoading(false);
    }
  };

  const submitForgot = async () => {
    setForgotMsg('');
    if (!forgotPhone) return setForgotMsg('Telefon nömrəsini daxil edin.');
    setForgotLoading(true);
    try {
      const { ok, data } = await authApi.forgotPassword(forgotPhone);
      if (!ok) return setForgotMsg(data.message || 'Xəta baş verdi.');
      goOtp({
        sessionId: data.sessionId,
        phone: authApi.toApiPhone(forgotPhone),
        flow: 'fg',
        description: `+994${forgotPhone} nömrəsinə WhatsApp OTP göndərildi.`,
        backTarget: 'fg',
      });
    } catch {
      setForgotMsg('Şəbəkə xətası.');
    } finally {
      setForgotLoading(false);
    }
  };

  const submitSetPassword = async () => {
    setSetPwMsg('');
    const { pw, pw2 } = newPw;
    if (!pw || !pw2) return setSetPwMsg('Bütün xanaları doldurun.');
    if (pw !== pw2) return setSetPwMsg('Şifrələr uyğun gəlmir.');
    if (pw.length < 8) return setSetPwMsg('Şifrə ən az 8 simvol olmalıdır.');

    setSetPwLoading(true);
    try {
      const { ok, data } = await authApi.setPassword({ phone: sessionRef.current.phone, password: pw, passwordConfirm: pw2 });
      if (ok) {
        setSuccessMsg('Şifrəniz uğurla yeniləndi!');
        setSuccessAction(() => () => {
          setTab('login');
          setPage('main');
        });
        setPage('sc');
      } else {
        setSetPwMsg(data.message || 'Xəta baş verdi.');
      }
    } catch {
      setSetPwMsg('Şəbəkə xətası.');
    } finally {
      setSetPwLoading(false);
    }
  };

  const resend = async () => {
    await authApi.resendOtp(sessionRef.current.sessionId);
    setOtpDigits(emptyOtp());
    otpRefs.current[0]?.focus();
    countdown.start(OTP_SECONDS);
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

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuth();
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
          maxWidth: 460,
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '56px 36px 36px',
          position: 'relative',
          margin: 16,
          animation: 'authPop 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both',
        }}
      >
        <button
          onClick={closeAuth}
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

        {page === 'main' && (
          <div className="am-page active">
            <div className="am-tabs">
              <button className={'am-tab' + (tab === 'register' ? ' active' : '')} onClick={() => setTab('register')}>Qeydiyyat</button>
              <button className={'am-tab' + (tab === 'login' ? ' active' : '')} onClick={() => setTab('login')}>Daxil ol</button>
            </div>

            {tab === 'register' ? (
              <div>
                <div className="am-title">Hesab yaradın</div>
                <div className="am-sub">Travellab ailəsinə qoşulun — pulsuz</div>
                {regMsg && <div className="am-msg er show">{regMsg}</div>}
                <div className="am-row">
                  <div className="am-group">
                    <label className="am-label">Ad</label>
                    <input className="am-input" type="text" placeholder="Leyla" value={reg.name} onChange={(e) => setReg((r) => ({ ...r, name: e.target.value }))} />
                  </div>
                  <div className="am-group">
                    <label className="am-label">Soyad</label>
                    <input className="am-input" type="text" placeholder="Məmmədova" value={reg.surname} onChange={(e) => setReg((r) => ({ ...r, surname: e.target.value }))} />
                  </div>
                </div>
                <div className="am-group">
                  <label className="am-label">Mobil Nömrə (Whatsapp aktiv olan nömrə)</label>
                  <div className="am-ph-row">
                    <div className="am-prefix">🇦🇿 +994</div>
                    <input className="am-input" type="tel" placeholder="50 XXX XX XX" maxLength={9} value={reg.phone} onChange={(e) => setReg((r) => ({ ...r, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="am-group">
                  <label className="am-label">E-poçt</label>
                  <input className="am-input" type="email" placeholder="leyla@example.com" value={reg.mail} onChange={(e) => setReg((r) => ({ ...r, mail: e.target.value }))} />
                </div>
                <div className="am-group">
                  <label className="am-label">Şifrə</label>
                  <div className="am-pw-wrap">
                    <input className="am-input" type={showRegPw ? 'text' : 'password'} placeholder="Ən az 8 simvol" value={reg.pw} onChange={(e) => setReg((r) => ({ ...r, pw: e.target.value }))} />
                    <button type="button" className="am-toggle" onClick={() => setShowRegPw((v) => !v)}>{showRegPw ? '🙈' : '👁'}</button>
                  </div>
                </div>
                <div className="am-group">
                  <label className="am-label">Şifrəni təkrarlayın</label>
                  <div className="am-pw-wrap">
                    <input className="am-input" type={showRegPw2 ? 'text' : 'password'} placeholder="Şifrəni təkrarlayın" value={reg.pw2} onChange={(e) => setReg((r) => ({ ...r, pw2: e.target.value }))} />
                    <button type="button" className="am-toggle" onClick={() => setShowRegPw2((v) => !v)}>{showRegPw2 ? '🙈' : '👁'}</button>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '4px 0 14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reg.terms}
                    onChange={(e) => setReg((r) => ({ ...r, terms: e.target.checked }))}
                    style={{ width: 18, height: 18, marginTop: 1, accentColor: 'var(--tl-green)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 12, color: 'rgba(29,41,57,.6)', lineHeight: 1.5 }}>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); openTerms(); }}
                      style={{ color: 'var(--tl-green)', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      Qaydalar və Şərtlərlə
                    </a>{' '}
                    razıyam
                  </span>
                </label>
                <button className={'am-btn' + (regLoading ? ' ld' : '')} disabled={regLoading} onClick={submitRegister}>
                  <span className="bt">Davam et</span>
                  <div className="sp" />
                </button>
                {GOOGLE_CLIENT_ID && (
                  <>
                    <div className="am-divider"><span>və ya</span></div>
                    <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }} />
                  </>
                )}
              </div>
            ) : (
              <div>
                <div className="am-title">Xoş gəldiniz</div>
                <div className="am-sub">Hesabınıza daxil olun</div>
                {loginMsg && <div className="am-msg er show">{loginMsg}</div>}
                <div className="am-group">
                  <label className="am-label">Mobil Nömrə</label>
                  <div className="am-ph-row">
                    <div className="am-prefix">🇦🇿 +994</div>
                    <input className="am-input" type="tel" placeholder="50 XXX XX XX" maxLength={9} value={login.phone} onChange={(e) => setLogin((l) => ({ ...l, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="am-group">
                  <label className="am-label">Şifrə</label>
                  <div className="am-pw-wrap">
                    <input className="am-input" type={showLoginPw ? 'text' : 'password'} placeholder="Şifrənizi daxil edin" value={login.pw} onChange={(e) => setLogin((l) => ({ ...l, pw: e.target.value }))} />
                    <button type="button" className="am-toggle" onClick={() => setShowLoginPw((v) => !v)}>{showLoginPw ? '🙈' : '👁'}</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginBottom: 11 }}>
                  <button className="am-link" onClick={() => setPage('fg')}>Şifrəmi unutdum</button>
                </div>
                <button className={'am-btn' + (loginLoading ? ' ld' : '')} disabled={loginLoading} onClick={submitLogin}>
                  <span className="bt">Daxil ol</span>
                  <div className="sp" />
                </button>
                {GOOGLE_CLIENT_ID && (
                  <>
                    <div className="am-divider"><span>və ya</span></div>
                    <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }} />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {page === 'otp' && (
          <div className="am-page active">
            <button className="am-back" onClick={() => setPage(otpBackTarget)}>← Geri</button>
            <div className="am-title">OTP Kodu</div>
            <div className="am-sub">{otpDesc}</div>
            {otpMsg && <div className="am-msg er show">{otpMsg}</div>}
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
              Kodun müddəti: <strong>{countdown.label}</strong>
            </div>
            <button className={'am-btn' + (otpLoading ? ' ld' : '')} disabled={otpLoading} onClick={submitOtp}>
              <span className="bt">Təsdiqlə</span>
              <div className="sp" />
            </button>
            <div style={{ textAlign: 'center', marginTop: 11 }}>
              <span style={{ fontSize: 12, color: 'rgba(29,41,57,.45)' }}>Kod gəlmədi? </span>
              <button className="am-link" disabled={countdown.secondsLeft > 0} onClick={resend}>Yenidən göndər</button>
            </div>
          </div>
        )}

        {page === 'fg' && (
          <div className="am-page active">
            <button className="am-back" onClick={() => setPage('main')}>← Geri</button>
            <div className="am-title">Şifrəni yenilə</div>
            <div className="am-sub">Şifrəni yeniləmək üçün ilk öncə qeydiyyatda olan mobil nömrənizi daxil edin.</div>
            {forgotMsg && <div className="am-msg er show">{forgotMsg}</div>}
            <div className="am-group">
              <label className="am-label">Mobil Nömrə (Whatsapp aktiv olan nömrə)</label>
              <div className="am-ph-row">
                <div className="am-prefix">🇦🇿 +994</div>
                <input className="am-input" type="tel" placeholder="50 XXX XX XX" maxLength={9} value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} />
              </div>
            </div>
            <button className={'am-btn' + (forgotLoading ? ' ld' : '')} disabled={forgotLoading} onClick={submitForgot}>
              <span className="bt">Davam et</span>
              <div className="sp" />
            </button>
          </div>
        )}

        {page === 'sp' && (
          <div className="am-page active">
            <button className="am-back" onClick={() => setPage('otp')}>← Geri</button>
            <div className="am-title">Yeni şifrə</div>
            <div className="am-sub">Güclü şifrə seçin.</div>
            {setPwMsg && <div className="am-msg er show">{setPwMsg}</div>}
            <div className="am-group">
              <label className="am-label">Yeni şifrə</label>
              <div className="am-pw-wrap">
                <input className="am-input" type={showNewPw ? 'text' : 'password'} placeholder="Ən az 8 simvol" value={newPw.pw} onChange={(e) => setNewPw((p) => ({ ...p, pw: e.target.value }))} />
                <button type="button" className="am-toggle" onClick={() => setShowNewPw((v) => !v)}>{showNewPw ? '🙈' : '👁'}</button>
              </div>
            </div>
            <div className="am-group">
              <label className="am-label">Şifrəni təkrarlayın</label>
              <div className="am-pw-wrap">
                <input className="am-input" type={showNewPw2 ? 'text' : 'password'} placeholder="Şifrəni təkrarlayın" value={newPw.pw2} onChange={(e) => setNewPw((p) => ({ ...p, pw2: e.target.value }))} />
                <button type="button" className="am-toggle" onClick={() => setShowNewPw2((v) => !v)}>{showNewPw2 ? '🙈' : '👁'}</button>
              </div>
            </div>
            <button className={'am-btn' + (setPwLoading ? ' ld' : '')} disabled={setPwLoading} onClick={submitSetPassword}>
              <span className="bt">Şifrəni yenilə</span>
              <div className="sp" />
            </button>
          </div>
        )}

        {page === 'sc' && (
          <div className="am-page active">
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div className="am-si">✓</div>
              <div className="am-title" style={{ textAlign: 'center' }}>Uğurlu!</div>
              <p className="am-sub" style={{ textAlign: 'center', marginBottom: 22 }}>{successMsg}</p>
              <button className="am-btn" onClick={successAction}>
                <span className="bt">Daxil ol →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
