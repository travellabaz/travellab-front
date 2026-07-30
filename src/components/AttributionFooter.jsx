import { useModals } from '../context/ModalContext';

// Hidden per Travellab's request, kept in the DOM per Travelpayouts' ToS
// for the White Label search widget (originally always display:none in
// the source HTML too — this isn't something the React port turned off).
export default function AttributionFooter() {
  const { openPrivacy } = useModals();
  const year = new Date().getFullYear();

  return (
    <footer className="tpwl-footer__wrapper" style={{ display: 'none' }}>
      <div className="tpwl__content">
        <div className="tpwl-footer__copyright">Travelpayouts © 2008−{year}</div>
        <div className="tpwl-footer__links">
          <a href="#" target="_blank" rel="noopener noreferrer">Terms of Service</a>
          <a href="#" onClick={(e) => { e.preventDefault(); openPrivacy(); }}>Privacy Policy</a>
          <a href="#" target="_blank" rel="noopener noreferrer">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}
