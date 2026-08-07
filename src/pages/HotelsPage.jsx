import HotelsSection from '../sections/HotelsSection';
import SeoBodyText from '../components/SeoBodyText';

export default function HotelsPage() {
  return (
    <main className="tpwl-main">
      <HotelsSection asH1 />

      <section>
        <div className="tl-section">
          <SeoBodyText>
            <p>
              Travellab səyahət agentliyi 220-dən çox ölkədə 2.6 milyondan artıq otel seçimini bir yerdə təqdim
              edir. Otel bron edərkən, büdcənizə uyğun ən sərfəli qiyməti seçə, ani təsdiq ala bilərsiniz.
            </p>
            <p>
              Onlayn otel axtarışı təhlükəsiz ödəniş sistemi ilə həyata keçirilir. Hər otel bron zamanı Labpoint
              bonus xalları qazanaraq növbəti səyahətinizdə istifadə edə bilərsiniz.
            </p>
          </SeoBodyText>
        </div>
      </section>
    </main>
  );
}
