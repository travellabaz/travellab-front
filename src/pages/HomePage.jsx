import ToursSection from '../sections/ToursSection';
import HotelsSection from '../sections/HotelsSection';
import CtaSection from '../sections/CtaSection';
import EventsSection from '../sections/EventsSection';
import LabpointSection from '../sections/LabpointSection';
import PartnersSection from '../sections/PartnersSection';

// HeroSearch (the Travelpayouts search widget) is mounted persistently in
// App.jsx instead of here — see the comment there for why.
// About and Blog stay reachable via their own dedicated pages/nav links,
// just not flattened into the homepage scroll.
export default function HomePage() {
  return (
    <main className="tpwl-main">
      <ToursSection />
      <HotelsSection />
      <CtaSection />
      <EventsSection />
      <LabpointSection />
      <PartnersSection />

      <section>
        <div className="tl-section" style={{ paddingTop: 0 }}>
          <div className="tl-article-body" style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2>Travellab — Etibarlı Səyahət Agentliyi</h2>
            <p>
              Travellab, Bakıda fəaliyyət göstərən tam xidmətli səyahət agentliyi olaraq, müştərilərinə aviabilet,
              otel bron, hazır tur paketləri, viza xidmətləri və tədbir biletlərini tək bir məkanda təqdim edir.
              Şirkətimiz Azərbaycan Turizm Agentlikləri Assosiasiyasının (ATAA) üzvüdür və illərdir fərdi,
              korporativ və VIP müştərilərə etibarlı xidmət göstərir.
            </p>
            <p>
              Səyahət agentliyi kimi əsas məqsədimiz — müştərilərimizə vaxt itirmədən, etibarlı və rahat şəkildə
              aviabilet, otel bron etmək imkanı yaratmaqdır. Aviabilet axtarışında yüzlərlə aviaşirkətin
              təkliflərini müqayisə edərək, sizə ən uyğun qiymət və uçuş vaxtını təklif edirik. Otel bron
              xidmətimiz vasitəsilə dünyanın istənilən nöqtəsində, büdcənizə uyğun otel seçimləri edə bilərsiniz.
            </p>
            <p>
              Hazır tur paketlərimiz Dubay, Türkiyə, Gürcüstan və digər populyar istiqamətləri əhatə edir —
              aviabilet, otel və transfer daxil olmaqla sərfəli qiymətlərlə. Viza xidmətimiz vasitəsilə
              səyahətinizin sənədləşmə prosesini asanlaşdırırıq. Tibbi turizm sahəsində də xarici müştərilərə
              dəstək göstəririk.
            </p>
            <p>
              Labpoint loyallıq proqramımız vasitəsilə hər bron zamanı bonus xallar qazanır və növbəti
              səyahətinizdə istifadə edə bilərsiniz. Səyahət agentliyi olaraq Travellab, müştəri məmnuniyyətini ön
              planda tutaraq, hər bir səyahətinizi rahat və unudulmaz etmək üçün buradadır.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
