import HotelsSection from '../sections/HotelsSection';

export default function HotelsPage() {
  return (
    <main className="tpwl-main">
      <HotelsSection asH1 />

      <section>
        <div className="tl-section">
          <div className="tl-article-body" style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2>Travellab ilə Otel Bron Etmək</h2>
            <p>
              Travellab səyahət agentliyi 220-dən çox ölkədə 2.6 milyondan artıq otel seçimini bir yerdə təqdim
              edir. Otel bron edərkən, büdcənizə uyğun ən sərfəli qiyməti seçə, ani təsdiq ala bilərsiniz.
            </p>
            <p>
              Onlayn otel axtarışı təhlükəsiz ödəniş sistemi ilə həyata keçirilir. Hər otel bron zamanı Labpoint
              bonus xalları qazanaraq növbəti səyahətinizdə istifadə edə bilərsiniz.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
