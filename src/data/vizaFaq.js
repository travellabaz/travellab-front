export const VIZA_FAQ = [
  {
    q: 'Sorğu göndərdikdən sonra nə qədər müddətdə mənimlə əlaqə saxlanılır?',
    a: 'Adətən bir neçə saat ərzində, iş saatları daxilində isə daha tez menecerimiz sizinlə WhatsApp və ya telefon vasitəsilə əlaqə saxlayır.',
  },
  {
    q: 'Viza üçün hansı sənədlər tələb olunur?',
    a: 'Tələb olunan sənədlər ölkədən ölkəyə dəyişir — pasport, foto, bank çıxarışı, işlə bağlı arayış və otel/bilet bronu ən çox rast gəlinənlərdir. Ölkəni seçib formu göndərdikdən sonra mütəxəssisimiz sizə tam siyahını göndərəcək.',
  },
  {
    q: 'Viza almaq nə qədər vaxt aparır?',
    a: 'Müddət ölkədən və konsulluğun iş yükündən asılı olaraq dəyişir — adətən bir neçə iş günündən bir neçə həftəyə qədər. Dəqiq müddəti müraciətinizdən sonra mütəxəssisimiz sizə bildirəcək.',
  },
  {
    q: 'Əvvəllər vizam rədd olunub, yenə müraciət edə bilərəmmi?',
    a: 'Bəli. Formda "Əlavə qeyd" hissəsində bunu qeyd edin — mütəxəssisimiz əvvəlki rəddin səbəbini nəzərə alaraq sənədlərinizi daha diqqətlə hazırlamağa kömək edəcək.',
  },
  {
    q: 'Uşaqla səyahət edirəm, əlavə sənəd lazımdırmı?',
    a: 'Bəli, yaşından asılı olaraq uşağın öz pasportu, doğum şəhadətnaməsi və bəzi hallarda valideyn razılığı tələb oluna bilər. Formu göndərərkən qeyd hissəsində uşaqla səyahət etdiyinizi yazın.',
  },
  {
    q: 'Xidmətiniz üçün nə zaman ödəniş edirəm?',
    a: 'Sorğu göndərmək və ilkin məsləhət pulsuzdur. Ödəniş yalnız xidmət şərtləri sizinlə razılaşdırıldıqdan sonra tələb olunur.',
  },
  {
    q: 'Şengen ölkələri üçün bir viza kifayət edir, yoxsa hər ölkəyə ayrıca müraciət lazımdır?',
    a: 'Şengen vizası əldə etdikdə Şengen zonasına daxil olan bütün ölkələrə səyahət edə bilərsiniz — ayrıca viza tələb olunmur. Müraciəti əsas səyahət planınıza uyğun ölkənin konsulluğuna edirik.',
  },
  {
    q: 'Təcili vəziyyətdə vizanı daha sürətli almaq mümkündürmü?',
    a: 'Bəzi ölkələr üçün təcili (expedited) müraciət seçimi mövcuddur, əlavə rəsmi haqq ilə. Formda tarixi qeyd edin, mütəxəssisimiz bu seçimin mümkün olub-olmadığını sizə bildirəcək.',
  },
];

// Per-country FAQ (VizaCountryPage.jsx) — 3 fixed questions per the
// {ölkə} template, not a 24-country hand-authored set. The first two
// deliberately don't state a specific processing time or document list:
// those vary by country/consulate/season and change often, and getting
// them wrong on a visa page is the kind of mistake that actually costs a
// customer money/time — so, same as the generic VIZA_FAQ above, they point
// to "ask our specialist" rather than a fabricated number. Swap in real
// per-country answers here once that data exists.
export function getVizaCountryFaq(countryName) {
  return [
    {
      q: `${countryName} vizası neçə günə çıxır?`,
      a: `Müddət ölkənin konsulluğundan, mövsümdən və müraciət növündən asılı olaraq dəyişir. ${countryName} üçün dəqiq müddəti formu göndərdikdən sonra mütəxəssisimiz sizə bildirəcək.`,
    },
    {
      q: `${countryName} vizası üçün hansı sənədlər lazımdır?`,
      a: `Tələb olunan sənədlər səyahətin məqsədindən (turist, iş, qohum ziyarəti və s.) asılı olaraq fərqlənir. Ölkəni seçib formu göndərdikdən sonra mütəxəssisimiz sizə ${countryName} üçün tam sənəd siyahısını göndərəcək.`,
    },
    {
      q: `Travellab ${countryName} vizası üçün necə kömək edir?`,
      a: `Travellab səyahət agentliyi olaraq, ${countryName} vizası üçün sənəd hazırlığından müraciətə qədər tam dəstək göstəririk — lazımi sənədlərin siyahısını hazırlayır, formların doldurulmasında kömək edir və konsulluqla əlaqəni asanlaşdırırıq.`,
    },
  ];
}
