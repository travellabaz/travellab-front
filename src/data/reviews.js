// Curated (not API-pulled) customer reviews shown on the Tours page — see
// ReviewsSection.jsx. Google Places API only returns up to 5 reviews with
// no control over which ones, so real testimonials are added here by hand
// instead, the same way blog posts are one file per post.
//
// All reviews show a fixed 5-star rating — add real reviews as objects
// shaped like this:
// {
//   id: 'unique-slug',
//   reviewerName: 'Ad Soyad',
//   text: 'Rəyin tam mətni...',
// }
// Ordered Azerbaijani-first (site's primary language), then Russian, then
// English, so the carousel opens with the language most visitors read.
export const REVIEWS = [
  { id: 'lamia-babazade', reviewerName: 'Lamia Babazade', text: '4 nəfər müraciət etdik və vizamızı aldıq 🧑🏼‍🩰 Ülkər xanıma çox təşəkkür edirik həm şən, mehriban, həm də işində diqqətli və məsuliyyətli idi. Son dərəcə razı qaldıq 🧑🏼‍🩰❤️' },
  { id: 'azer-atamoglanov', reviewerName: 'Azer Atamoglan_ov', text: 'İnstagram-da Travellab-ın paylaşımını gördüm, müraciət etdim və Əfsanə xanımın dəstəyi ilə ilkin mərhələni sürətli və rahat şəkildə tamamladıq. Qaldı səyahət edib, təcrübəni yaşamaq. ✌️' },
  { id: 'jasmin-g', reviewerName: 'jasmin.g', text: 'Səyahət üçün Travellaba müraciət etdim. Əfsanə xanım çox sağolsun dəqiq bir şəkildə mənimlə maraqlandı, bütün istəklərimi nəzərə alaraq mənə uygun avaiabilet və otel təklif etti. Əfsanə xanimdan çox razı qaldım, yenə Əfsanə xanım Travellaba müraciət edəcəyəm.' },
  { id: 'vusala-aliyeva', reviewerName: 'Vusala Aliyeva', text: 'Göstərilən xidmətdən və mənə hər bir şeydə dəstək olan Əfsanə xanıma təşəkkür edirəm. Ümid edirəm ki Travellab ilə bir çox səyahətlərimi həyata keçirərəm. ☺️🙏' },
  { id: 'mehsin-quliyev', reviewerName: 'Mehsin Quliyev-Qafqazly', text: 'Qeyri iş günləri və qeyri iş saatı olmağına baxmayaraq Qumral xanım operativ cavablandırması və köməklik göstərməsinə görə dərin təşəkkürlərimi bildirirəm.' },
  { id: 'sanan-orujlu', reviewerName: 'Sanan Orujlu', text: 'Travellab komandası ilə səyahət təcrübəmiz çox uğurlu və yadda qalan oldu! Xüsusilə Ülkər xanıma xüsusi təşəkkür etmək istəyirəm – hər detalı incəliklə düşündü, bütün suallarımıza səbr və gülərüzlə cavab verdi. Onun dəstəyi sayəsində səyahətimiz problemsiz və rahat keçdi. Belə peşəkar və diqqətli yanaşmaya görə Travellab-ı hər kəsə tövsiyə edirəm!' },
  { id: 'nazperi-abdurahmanova', reviewerName: 'Nazperi Abdurahmanova', text: 'Vİza prosesi və səfər hazırlıqları zamanı göstərdikləri dəstəyə görə Travellab komandasına, xüsusilə də Əfsanə xanıma təşəkkür edirəm. 🌻✨' },
  { id: 'hidayat-rzayev', reviewerName: 'Hidayat Rzayev', text: 'Çox sürətli və effektiv servis. Biz Yunanıstanın Santorini adasına iki nəfərlik tur aldıq 5 gün 4 gecəlik, gediş gəliş, hotel, qidalanma hamısı daxil. Qiymətlər çox əlverişlidi, komanda olaraq çox professional iş görürlər. Yenə müraciət edəcəm harasa səyahət eləmək istəyəndə 👍🏻' },
  { id: 'elshad-madridista', reviewerName: 'Elshad Madridista', text: 'Travellab şirkətinin verdiyi çevik dəstəyə və istəyimə uyğun hazırladığı tura görə təşəkkür edirəm. Xüsusi ilə Əfsanə xanımın 7/24 dəstəyi möhtəşəm idi.' },
  { id: 'gunay-hasanova', reviewerName: 'GunAy Hasanova', text: 'Çox uyğun qiymətə ən yaxşı xidmət göstərən travel şirkəti 👍 Bütün işçilərinə xüsusi ilə Xəyalə xanıma təşəkkür, səbrlə bütün suallara cavab verib istəyimizə uyğun turlar təşkil edib.' },
  { id: 'ilyas-abiyev', reviewerName: 'Ilyas Abiyev', text: 'Viza dəstəyi aldıq. İlk şengen vizası idi, Ülkər xanımın dəstəyi ilə problemsiz vizalarımızı aldıq.' },
  { id: 'zakira-ahmadova', reviewerName: 'Zakira Ahmadova', text: 'Peşəkar komanda, operativ geri dönüşlər, müştərinin büdcəsinə uyğun turların təklifləri ilə seçilən möhtəşəm komanda!!!' },
  { id: 'sevin-xelilli', reviewerName: 'Sevin Xəlilli', text: 'Bütün səyahətlərimizi rahatlıqla etibar etdiyimiz şirkət ☺️ xüsusilə Ülkər xanıma çox təşəkkür edirəm ☺️ yorulmadan, bezmədən hər sualımızı cavablandırıb, ən xırda detallarına qədər düşünülmüş bir səyahət etdik sayəsində 😘' },
  { id: 'pnar-garibova', reviewerName: 'Pnar Garibova', text: 'Peşəkar yanaşma, yaxşı təşkil olunmuş tur proqramları və səmimi personal sayəsində rahat seçim və səyahət yaşadım. ☺️' },
  { id: 'savalan-amirov', reviewerName: 'Savalan Amirov', text: 'İstəklərimlə maraqlanmağı və ən əsası büdcə + maraqları əhatə edən tövsiyələr verməkləri əla idi.' },
  { id: 'huseyn-huseynov', reviewerName: 'Huseyn Huseynov', text: 'Təcrübəli, gülərüz, daim hər mövzuda məlumatlandırıb dəstək verən əməkdaşlarına təşəkkür edirəm.' },
  { id: 'meleyke-ehmedova', reviewerName: 'Meleyke Ehmedova', text: 'Günün istənilən saatında ünvanlandığımız bütün suallara səmimi, izahlı cavablar verdiyi üçün, operativ Ülkər xanıma xüsusi təşəkkürlər. 🥰♥️' },
  { id: 'san-dj', reviewerName: 'San Dj', text: 'Спасибо большое Travellab за прекрасно организованную поездку и высокий уровень сервиса. Отдельная благодарность Афсане ханум за терпение, внимание и понимание — она всегда выслушивала все наши просьбы и вопросы, помогала и поддерживала на каждом этапе. Очень приятно иметь дело с таким ответственным и заботливым подходом. Обязательно обратимся снова!' },
  { id: 'sevda-azizova', reviewerName: 'Sevda Azizova', text: 'Отличный сервис. Благодаря травеллаб я попала на концерт Coldplay в Абудаби, исполнила давнюю мечту) отдельная благодарность Афсане ханум, за терпение и доброжелательность. С тех пор еще не раз пользовалась услугами компании. Рекомендую.' },
  { id: 'naila-babashova', reviewerName: 'Naila Babashova', text: 'Отдыхала в Турции с помощью тур агентства TravelLab всё прошло идеально! Отличная организация, классный отель, всегда на связи. Спасибо за крутой отдых, обязательно поеду с вами снова!' },
  { id: 'xuraman-muzaffari', reviewerName: 'Xuraman Muzaffari', text: 'На все наши вопросы отвечали быстро, компания Khayala Khanum очень помогла нам найти отель, который лучше всего соответствовал нашим требованиям и бюджету. Более того, сравнив предложения других туристических агентств, мы обнаружили, что у Travellab было самое подходящее предложение 👍' },
  { id: 'jale-kazimova', reviewerName: 'Jale Kazimova', text: 'Госпожа Улькер 😍 действительно очень эффективна и ответственна в своей работе, она оказывает мне огромную поддержку в каждой моей поездке 🥰' },
  { id: 'fatima-smylv', reviewerName: 'Fatima Smylv0001', text: 'Although our holiday hasn’t started yet, I would like to sincerely thank Afsana khanum for her outstanding assistance during the planning and ticketing process. From the very beginning, she was patient, responsive, kind and highly professional — answering all our questions, explaining the details clearly, and helping us feel confident about the trip. Organizing international travel can be stressful, but her support made everything feel smooth and stress-free. We truly appreciate the effort she put in so far and are looking forward to the rest of the experience!' },
  { id: 'mr-marco', reviewerName: 'Mr Marco', text: 'Ms Afsana was very helpful and helped me a lot in organizing an ideal holiday tour. Travel lab is my favorite tourism agency in 2025. Thanks to the whole team' },
  { id: 'mohamed-cherfaoui', reviewerName: 'Mohamed Cherfaoui', text: 'Very good agency i fond all what i like, very good communication and suggestion off best flight, Hôtels thank you 🙂' },
  { id: 'fatima-ismayilova', reviewerName: 'Fatima Ismayilova', text: 'I have been working with Travellab Agency, especially Afsana Khanum, for the past two years, and the service has always been excellent. She is professional, reliable, and always ready to help. I truly appreciate her consistent support. She is always responsive and tries her best to provide the best solution in a short time. Highly recommended! Thank you!' },
];
