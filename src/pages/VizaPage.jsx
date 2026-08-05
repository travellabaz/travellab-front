import VizaSection from '../sections/VizaSection';
import FaqSection from '../components/FaqSection';
import { VIZA_FAQ } from '../data/vizaFaq';

export default function VizaPage() {
  return (
    <main className="tpwl-main">
      <VizaSection />
      <FaqSection tag="Suallar" title="Viza ilə bağlı tez-tez verilən suallar" items={VIZA_FAQ} />
    </main>
  );
}
