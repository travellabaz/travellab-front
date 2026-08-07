// HeroSearch (hero + Travelpayouts search widget) is mounted persistently
// in App.jsx and already covers the actual search UI — this page just adds
// the SEO body copy below it (see App.jsx for why HeroSearch itself, and
// its <h1>, are shared across every route rather than owned per-page).
export default function SearchPage() {
  return (
    <main className="tpwl-main">
      <section>
        <div className="tl-section">
          <div className="tl-article-body" style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2>Travellab ilə Aviabilet Necə Bron Edilir?</h2>
            <p>
              Travellab səyahət agentliyi vasitəsilə aviabilet axtarışı sadə və sürətlidir. Bakıdan dünyanın
              istənilən nöqtəsinə uçuş axtararkən, yüzlərlə aviaşirkətin təkliflərini bir yerdə müqayisə edə, ən
              sərfəli aviabilet qiymətini taparaq bir neçə dəqiqəyə bron edə bilərsiniz.
            </p>
            <p>
              Sərfəli aviabilet tapmaq üçün tarix və istiqaməti daxil etməyiniz kifayətdir — sistemimiz sizə ən
              uyğun uçuş vaxtı və qiymət seçimlərini təqdim edəcək. Hər bron zamanı Labpoint bonus xalları da
              qazanırsınız.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
