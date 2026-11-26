# K2 Bölge Listesi (Öneri v0)

Hazırlayan: Dünya ve Kültür departmanı · Tarih: 2026-11-26 · Durum: **Öneri v0.1, Kalite denetimi şartlı geçti (docs/denetim/2026-11-26-dunya-kultur.md), düzeltmeler uygulandı; Atakan onayı bekliyor**

## Bu belge ne işe yarar?
Dünyadaki her ülke (BM WPP 2024 dosyasındaki 236 ülke/bölge + Kosova) tam olarak **bir** bölgeye konur. K1 olmayan bir ülkede doğan oyuncunun hayatı:
- **rakamlarda** kendi ülkesinin verisini (doğum, ölüm, gelir, okullaşma),
- **kültürel dokuda** bölgenin şablonunu (isim yapısı, aile düzeni, konut, kıyafet, sahne kiti) kullanır.

K1 ülkeler de bir bölgeye bağlıdır; bölgenin görsel kitini kullanır, üstüne kendi ayrıntısını ekler.

## Gruplamanın mantığı
"Coğrafi kıta" değil, **gündelik hayatın benzerliği**: dil ailesi, din, aile düzeni, sömürge ya da sosyalizm geçmişi, iklim ve konut tipi. Hiçbir gruplama mükemmel değildir. Her bölgede "iç farklar" yazıldı; şablon bunları alt varyant olarak taşımalı. Bir bölgenin içindeki zengin-yoksul, şehir-köy, farklı din ve etnik grupları tek bir görüntüye indirgemek **yasak** (departman kuralı).

13 bölge öneriyoruz (hedef ~12'ydi). 12'ye indirmek istenirse en makul birleştirme: R02 Sahel + R01 Batı Afrika (açık soru).

## Doğum payları
Kaynak: BM WPP 2024, 2023 doğumları (Our World in Data işlenmiş dosyası, bkz. `content/countries/K1-liste.md`). Toplam %99,98. Kosova (`OWID_KOS`, 2023: 20.514 doğum) dosyada ayrı satır ve Sırbistan'ın içinde **sayılmıyor**; dünya toplamına zaten dahil olduğu için R13'e eklendi (Kalite denetimi bulgusu 1.4; önceki "çift sayım riski" değerlendirmesi yanlıştı). Kalan yaklaşık 21.308 doğumun (dünya toplamı − 237 satır) hangi satır olduğu Veri departmanı tarafından bulunacak; bu bir yuvarlama farkı değil.

| Kod | Bölge | Ülke sayısı | 2023 doğum payı | K1 ülkeleri |
|---|---|---:|---:|---|
| R01 | Batı Afrika (kıyı ve orman kuşağı) | 13 | %8,89 | NGA |
| R02 | Sahel ve Sudan kuşağı | 6 | %4,13 | SDN |
| R03 | Orta Afrika | 8 | %5,50 | COD |
| R04 | Doğu Afrika ve Afrika Boynuzu | 10 | %8,90 | ETH, TZA |
| R05 | Güney Afrika ve Hint Okyanusu adaları | 15 | %4,22 | ZAF |
| R06 | Kuzey Afrika ve Batı Asya | 19 | %6,66 | EGY |
| R07 | Anadolu, İran, Kafkasya ve Orta Asya | 11 | %4,43 | TUR, IRN |
| R08 | Güney Asya | 7 | %26,12 | IND, PAK, BGD |
| R09 | Doğu Asya | 8 | %7,93 | CHN, JPN |
| R10 | Güneydoğu Asya ve Pasifik adaları | 32 | %8,01 | IDN, PHL |
| R11 | Latin Amerika ve Karayipler | 49 | %7,08 | BRA, MEX |
| R12 | Batı (Batı/Kuzey/Güney Avrupa, Kuzey Amerika, Avustralya-Yeni Zelanda) | 38 | %6,11 | USA, DEU |
| R13 | Doğu Avrupa ve Balkanlar (sosyalizm sonrası) | 21 | %2,01 | RUS |

Not: "Görsel ortaklık" satırları Görsel ve Arayüz departmanının bölge kiti çizmesi içindir. Bunlar **sık görülen** örneklerdir, "herkes böyle yaşar" değildir. Her kit en az bir **şehir** ve bir **kırsal**, en az iki **gelir seviyesi** varyantı içermeli. Görsel notlar genel bilgiye dayanır; ülke profilleri doldukça kaynaklı hâle gelecek (**doğrulanmalı**).

---

## R01 · Batı Afrika (kıyı ve orman kuşağı)
**Ülkeler:** NGA, GHA, CIV, BEN, TGO, LBR, SLE, GIN, GNB, SEN, GMB, CPV, SHN
**Neden bir arada:** Gine Körfezi ve Atlantik kıyısı; çok dilli toplumlar (her ülkede onlarca dil + İngilizce/Fransızca/Portekizce resmi dil), güneyde Hristiyan, kuzeye ve Senegal'e doğru Müslüman ağırlık, yerel inançlar; geniş aile ve soy bağları güçlü; hızlı büyüyen megakentler (Lagos, Abidjan, Accra, Dakar) ile köy hayatı yan yana; gayriresmî ticaret ve pazar kültürü.
**İç farklar:** İngilizce ve Fransızca konuşan ülkeler (okul sistemi buna göre değişir); kıyı ile kuzey savan; Nijerya'nın kendi içinde kuzey-güney farkı çok büyük. Saint Helena (SHN) küçük bir Britanya adası; doğum payı yok denecek kadar az, istisna olarak işaretlenmeli. Yeşil Burun (CPV) Portekizce-Kreol ada ülkesi.
**Görsel ortaklık:** Tropik, nemli; yağmur ve kuru mevsim. Şehirde beton bloklar, oluklu metal çatılar, kalabalık pazarlar, sarı minibüs/otobüs, motosiklet taksi; kırsalda kerpiç ya da beton duvarlı, oluklu sac veya saz çatılı evler. Renkli desenli kumaşlar (wax print), hem geleneksel hem batı tarzı giyim. Palmiye, mango ağacı, kırmızı toprak.

## R02 · Sahel ve Sudan kuşağı
**Ülkeler:** MLI, NER, BFA, TCD, MRT, SDN
**Neden bir arada:** Sahra'nın güney kenarı; yarı kurak iklim; Müslüman çoğunluk; göçebe hayvancılık ile yerleşik tarımın iç içe olduğu hayatlar; Arapça ve yerel dillerin (Hausa, Bambara, Fulfulde vb.) yanı sıra Fransızca (Sudan'da İngilizce/Arapça); dünyanın en yüksek doğurganlık oranlarının bir kısmı; kuraklık, çatışma ve yerinden edilme tekrarlayan olaylar.
**İç farklar:** Sudan Arap ve Afrika kimliklerinin buluştuğu, Nil kıyısı kentli bir geçmişi olan ayrı bir dünya (R06 ile köprü). Moritanya'da Arap-Berberi ve Siyah Afrikalı topluluklar. Göçebe / yarı göçebe / köylü / kentli hayatlar ayrı ayrı temsil edilmeli. Çatışma bölgeleri "bütün ülke savaş" diye gösterilmemeli.
**Görsel ortaklık:** Kurak, sıcak, toz; kısa yağmur mevsimi. Kerpiç (çamur tuğla) evler ve camiler, avlulu duvarlı yapılar, yuvarlak saz kulübeler, göçebe çadırları. Uzun, bol giysiler, başörtüleri, türbanlar. Akasya, baobab, kum, eşek arabası, kuyu.

## R03 · Orta Afrika
**Ülkeler:** COD, COG, CMR, CAF, GAB, GNQ, AGO, STP
**Neden bir arada:** Kongo havzası ve çevresi; ekvator ormanı ve savan; Bantu dilleri ağırlıklı; Hristiyan çoğunluk (Katolik + Protestan + bağımsız kiliseler); madencilik ve petrol ekonomileri ile geçimlik tarım; Fransızca (ve Angola, São Tomé'de Portekizce) okul dili.
**İç farklar:** Kinşasa, Luanda gibi milyonluk kentler ile ulaşılması zor orman köyleri; KDC'nin doğusundaki uzun süreli çatışma ile batısı çok farklı; Kamerun'da İngilizce ve Fransızca bölgeler; Gabon ve Ekvator Ginesi'nde petrol geliri ama eşitsiz dağılım.
**Görsel ortaklık:** Çok yağışlı, yeşil, nehir. Kerpiç veya tuğla, sac çatılı evler; kentte kalabalık gecekondu mahalleleri ve beton yapılar; nehir tekneleri (piroga), kamyon ve minibüs. Renkli kumaşlar, kentte "sape" gibi şık giyim gelenekleri. Muz, manyok tarlası, orman.

## R04 · Doğu Afrika ve Afrika Boynuzu
**Ülkeler:** ETH, ERI, DJI, SOM, KEN, UGA, TZA, RWA, BDI, SSD
**Neden bir arada:** Doğu Afrika yaylaları ve Hint Okyanusu kıyısı; Svahili ticaret dünyası; Etiyopya ve Eritre'nin kendine özgü Ortodoks Hristiyan ve Ge'ez yazı geleneği; Somali ve kıyıda İslam; çobanlık ve tarım; mobil para ve hızlı kentleşme (Nairobi, Addis Ababa, Dar es Salaam).
**İç farklar:** Boynuz (Etiyopya, Eritre, Somali, Cibuti) ile Büyük Göller (Uganda, Ruanda, Burundi) kültürel olarak farklı; Güney Sudan yeni bir ülke (2011) ve uzun çatışma geçmişi. Kenya ve Tanzanya'da kıyı (Müslüman, Svahili) ile iç (Hristiyan çoğunluk) farkı. Etiyopya'da onlarca etnik grup ve bölgesel federalizm.
**Görsel ortaklık:** Yaylada ılıman, kıyıda sıcak-nemli, Boynuz'da kurak. Yuvarlak kulübeler (tukul), sac çatılı beton evler, kentte apartman ve inşaat; minibüs taksiler (matatu, dala dala), motosiklet taksi (boda boda). Etiyopya'da beyaz pamuklu şallar; Svahili kıyısında kanga/kikoi kumaşları. Çay ve kahve tarlaları, okaliptüs, savan.

## R05 · Güney Afrika ve Hint Okyanusu adaları
**Ülkeler:** ZAF, NAM, BWA, ZWE, ZMB, MWI, MOZ, LSO, SWZ, MDG, COM, MUS, SYC, REU, MYT
**Neden bir arada:** Güney Afrika ekonomisine bağlı göç ve maden işçiliği ağları; Bantu dilleri (Zulu, Xhosa, Shona, Chewa...) ve İngilizce/Portekizce; Hristiyan çoğunluk; HIV salgınının hayatları derinden etkilediği bölge (oranlar ülke verisinden gelmeli); apartheid ve bağımsızlık mücadeleleri ortak tarih.
**İç farklar:** Güney Afrika Cumhuriyeti içinde dünyanın en yüksek eşitsizliklerinden biri: banliyö, township, kırsal homeland mirası ayrı hayatlardır. Madagaskar Avustronezya kökenli dil ve kültürüyle (Malgaşça) ayrı bir dünya; Komorlar ve Mayotte Müslüman ve Svahili/Fransız etkili; Mauritius'ta Hint kökenli çoğunluk; Réunion ve Mayotte Fransa'ya bağlı.
**Görsel ortaklık:** Ilıman-subtropik, kuru kış. Township'te küçük tek katlı beton evler ve sac barakalar, banliyöde bahçeli ev ve duvar; kırsalda yuvarlak boyalı kulübeler (rondavel). Minibüs taksi. Adalarda tropik, pirinç tarlaları (Madagaskar).

## R06 · Kuzey Afrika ve Batı Asya
**Ülkeler:** EGY, LBY, TUN, DZA, MAR, ESH, SAU, YEM, OMN, ARE, QAT, BHR, KWT, IRQ, SYR, JOR, LBN, PSE, ISR
**Neden bir arada:** Büyük çoğunlukta Arapça ve İslam; geniş aile ve akrabalık ağları; Akdeniz ve çöl iklimi; ortak Osmanlı ve sömürge sonrası geçmiş; Körfez'de petrol zenginliği ve yabancı işçi göçü; savaş ve yerinden edilme yakın tarihin parçası (Irak, Suriye, Yemen, Libya, Filistin).
**İç farklar:** Mağrip (Fas, Cezayir, Tunus: Arapça + Amazigh/Berberi dilleri + Fransızca) ile Levant ve Körfez farklı. Körfez ülkelerinde nüfusun büyük kısmı yabancı işçi olabilir; vatandaş hayatı ile göçmen işçi hayatı **ayrı** temsil edilmeli. Lübnan ve Mısır'da büyük Hristiyan toplulukları (Maruni, Kıpti); Irak'ta Kürt, Ezidi, Süryani, Türkmen topluluklar; Sünni-Şii farkı. **İsrail** bu bölgeye coğrafya ve iklim yüzünden kondu ama Arap ülkesi değil: İbranice, Yahudi çoğunluk, Arap vatandaşlar, kadın ve erkeğe zorunlu askerlik; şablonda kendi alt profili olmalı. Filistin ve İsrail metinleri Kalite'nin hassasiyet denetiminden özellikle geçmeli.
**Görsel ortaklık:** Sıcak-kurak, Akdeniz kıyısında ılıman. Düz damlı beton apartmanlar, avlulu evler, eski kent dokusu (medine, çarşı), Körfez'de cam kuleler ve villa siteleri; kırsalda taş ve kerpiç evler. Hurma ağacı, zeytin, çöl. Giyimde çok çeşitlilik: kentte batı tarzı, başörtüsü, Körfez'de beyaz thobe ve siyah abaya, Mağrip'te djellaba. Mikrobüs ve servis taksi.

## R07 · Anadolu, İran, Kafkasya ve Orta Asya
**Ülkeler:** TUR, IRN, AFG, AZE, ARM, GEO, KAZ, UZB, TKM, KGZ, TJK
**Neden bir arada:** Türk ve İran dil-kültür havzası ve bunların buluşma alanı; İslam çoğunluk (Türkiye ve Orta Asya'da Sünni ağırlık, İran ve Azerbaycan'da Şii ağırlık), Kafkasya'da Ortodoks/Apostolik Hristiyan Gürcistan ve Ermenistan; ortak yemek, müzik ve misafirlik gelenekleri (çay, pilav, halı); ataerkil geniş aileden kentli çekirdek aileye hızlı geçiş; deprem kuşağı.
**İç farklar:** Kafkasya ve Orta Asya'da güçlü **Sovyet mirası** (panel apartman blokları, Rusça, laik devlet geçmişi; R13 ile köprü). Afganistan uzun savaşlar ve 2021 sonrası kadınların eğitim ve çalışma kısıtlamalarıyla ayrı özen ister; Peştun nüfusu Pakistan ile (R08) ortak. Türkiye'de Kürt, Alevi, gayrimüslim topluluklar; İran'da Azeri, Kürt, Beluç, Arap topluluklar. Kazakistan ve Kırgızistan'da göçebe geçmişi (yurt/boz üy).
**Görsel ortaklık:** Karasal iklim: sert kış, sıcak kuru yaz; dağlar ve bozkır. Kentte çok katlı apartmanlar (Türkiye'de "site"ler, Orta Asya'da Sovyet blokları), eski mahallelerde avlulu evler; kırsalda kerpiç, taş ve ahşap evler; bozkırda keçe çadır (yurt). Çay bardağı, halı/kilim, dolmuş ve minibüs. Giyim kentte batı tarzı; kırsalda şalvar, başörtüsü, kalpak gibi bölgesel parçalar.

## R08 · Güney Asya
**Ülkeler:** IND, PAK, BGD, NPL, LKA, BTN, MDV
**Neden bir arada:** Ortak tarih (Britanya sömürgesi, 1947 bölünmesi), birbirine yakın dil aileleri (Hint-Aryan + Dravid), ortak yemek ve giyim kültürü; Hindu, Müslüman, Budist, Sih, Hristiyan toplulukların iç içeliği; aileler arası görücü usulü evliliğin hâlâ yaygın olması; muson iklimi ve tarımın ritmi; dünyanın en kalabalık bölgesi (doğumların %26'sı).
**İç farklar:** Hindistan tek başına bir kıta gibi: eyaletlere göre dil, din, gelir, doğurganlık çok farklı (Kerala ile Bihar ayrı dünyalar). Pakistan ve Bangladeş Müslüman çoğunluklu; Sri Lanka ve Bhutan Budist ağırlıklı; Nepal Hindu-Budist dağ ülkesi; Maldivler Müslüman ada ülkesi. Kast, sınıf ve din farkları "tek tip" anlatılmamalı ve karikatürleştirilmemeli.
**Görsel ortaklık:** Muson: sıcak, çok nemli yağmur mevsimi; kuzeyde soğuk kış ve Himalaya. Kentte kalabalık çok katlı beton binalar, düz damlar, su tankları, gecekondu mahalleleri ile yeni siteler; kırsalda kerpiç ve tuğla evler. Üç tekerlekli motorlu taksi (rickshaw), bisiklet ve motosiklet, kalabalık tren. Sari, salvar kamiz, lungi, kurta. Pirinç tarlası, hindistancevizi, banyan ağacı.

## R09 · Doğu Asya
**Ülkeler:** CHN, JPN, KOR, PRK, TWN, MNG, HKG, MAC
**Neden bir arada:** Çin yazısı ve Konfüçyüsçü aile ve eğitim değerlerinin ortak mirası; çok yüksek eğitim rekabeti ve sınav kültürü (gaokao, Japonya ve Kore üniversite sınavları); hızlı yaşlanma ve çok düşük doğurganlık; pirinç ve çay kültürü.
**İç farklar:** Çin'de kent-köy farkı ve hukou (nüfus kaydı) sistemi, kırdan kente göç eden işçiler; Japonya ve Kore zengin ve yaşlanan toplumlar; Kuzey Kore kapalı ve güvenilir veri çok az (dikkatle, kaynakla); Moğolistan göçebe geçmişi ve Budizm ile ayrı (R07 ile köprü); Hong Kong, Makao, Tayvan kendi idari ve siyasi bağlamlarıyla.
**Görsel ortaklık:** Kuzeyde karasal, güneyde subtropik; dört belirgin mevsim. Kentte çok yüksek apartman blokları, küçük daireler, neon tabelalar, metro ve hızlı tren; kırsalda tek katlı tuğla evler, pirinç terasları; Japonya'da ahşap müstakil evler. Moğolistan'da ger (keçe çadır). Giyim kentte modern; bayram ve törenlerde geleneksel giysiler (hanfu, kimono, hanbok).

## R10 · Güneydoğu Asya ve Pasifik adaları
**Ülkeler:** IDN, PHL, VNM, THA, MMR, MYS, KHM, LAO, SGP, TLS, BRN, PNG, FJI, SLB, VUT, WSM, TON, KIR, FSM, MHL, PLW, NRU, TUV, NCL, PYF, WLF, COK, NIU, TKL, GUM, MNP, ASM
**Neden bir arada:** Tropik muson iklimi, pirinç tarımı ve ada/kıyı hayatı; Avustronezya dil ailesinin Endonezya ve Filipinler'den Pasifik'e uzanan yayılımı; yurt dışında çalışma (Filipinler, Endonezya) ve havale gelirleri; tayfun, sel, deprem ve yanardağ gibi afetler.
**İç farklar:** Din çok çeşitli: Endonezya, Malezya, Brunei'de Müslüman; Filipinler ve Doğu Timor'da Katolik; Tayland, Myanmar, Kamboçya, Laos'ta Theravada Budist; Vietnam'da Mahayana ve halk inançları. Singapur çok zengin şehir-devlet. **Pasifik adaları** (Melanezya, Polinezya, Mikronezya) doğum payı çok küçük ama kültürel olarak ayrı; ileride alt bölgeye ayrılabilir. Papua Yeni Gine'de 800'den fazla dil konuşulduğu sıkça belirtilir (doğrulanmalı).
**Görsel ortaklık:** Sıcak ve nemli, yağmur ormanı, pirinç tarlası, kıyı. Kırsalda direkler üstünde ahşap ve bambu evler; kentte dar, uzun "tüp evler" (Vietnam), çok katlı dükkân-evler, kalabalık motosiklet trafiği, jeepney (Filipinler). Batik, sarong, longyi; kentte modern giyim.

## R11 · Latin Amerika ve Karayipler
**Ülkeler:** MEX, GTM, BLZ, HND, SLV, NIC, CRI, PAN, CUB, DOM, HTI, JAM, PRI, TTO, BHS, BRB, AIA, ATG, ABW, BES, VGB, CYM, CUW, DMA, GRD, GLP, MTQ, MSR, BLM, KNA, LCA, MAF, VCT, SXM, TCA, VIR, BRA, ARG, COL, PER, VEN, CHL, ECU, BOL, PRY, URY, GUY, SUR, GUF
**Neden bir arada:** İspanyol ve Portekiz sömürge mirası; İspanyolca ve Portekizce; Katolik çoğunluk ve hızla büyüyen Evanjelik kiliseler; yerli, Afrika kökenli, Avrupa kökenli ve karışık (mestizo) toplumlar; çok yüksek kentleşme ve büyük gelir eşitsizliği; güçlü aile ve komşuluk bağları, futbol, müzik ve dans kültürü. (Şiddet ve suç oranları bölgenin tanımı değildir; ülke verisinden gelir.)
**İç farklar:** Bölge geniş; Görsel için **4 alt kit** öneriyoruz: (a) Meksika ve Orta Amerika, (b) Karayipler (İngilizce, Fransızca, Hollandaca ve İspanyolca konuşan adalar; Haiti'de Kreol), (c) And ülkeleri (yüksek dağ, yerli diller: Keçuva, Aymara), (d) Brezilya ve Güney Koni (Arjantin, Şili, Uruguay'da Avrupa göçü etkisi). Guyana ve Surinam'da büyük Hint kökenli topluluklar; Fransız Guyanası Fransa'ya bağlı.
**Görsel ortaklık:** Tropikten And soğuğuna ve Patagonya'ya kadar. Renkli boyalı beton evler, düz çatılar, demir parmaklıklı pencereler; tepelere tırmanan kendi kendine yapılmış mahalleler (favela, barrio); sömürge dönemi meydanları ve kiliseler; kırsalda kerpiç evler. Kalabalık otobüsler, kamyonet taşımacılığı. And'da renkli dokuma şallar ve şapkalar.

## R12 · Batı (Batı/Kuzey/Güney Avrupa, Kuzey Amerika, Avustralya-Yeni Zelanda)
**Ülkeler:** AUT, BEL, CHE, DEU, DNK, ESP, FIN, FRA, GBR, GRC, IRL, ISL, ITA, LUX, MLT, NLD, NOR, PRT, SWE, CYP, AND, MCO, SMR, VAT, LIE, GIB, GGY, JEY, IMN, FRO, GRL, USA, CAN, AUS, NZL, BMU, SPM, FLK
**Neden bir arada:** Yüksek gelirli, yaşlanan, büyük ölçüde laikleşmiş Hristiyan kökenli toplumlar; refah devleti ya da (ABD'de) özel sigorta ağırlıklı sistemler; çekirdek aile, geç evlilik, evlilik dışı birliktelik ve boşanmanın yaygınlığı; dünyanın her yerinden gelen göçmenler (Türkiye'den gelenler dahil) nüfusun önemli bir kısmı.
**İç farklar:** Bu bölge bilerek geniş tutuldu; Görsel için **3 alt kit**: (a) Kuzey ve Batı Avrupa (apartman, bisiklet, toplu taşıma), (b) Güney Avrupa (Akdeniz, aile bağları daha güçlü, genç işsizliği), (c) Kuzey Amerika ve Avustralya-Yeni Zelanda (banliyöde bahçeli müstakil ev, araba bağımlılığı). ABD, Kanada, Avustralya ve Yeni Zelanda'da yerli halklar (Kızılderili, Aborijin, Maori) ve göçmen toplulukları ayrı hayatlar olarak temsil edilmeli. Grönland'da Inuit çoğunluk. Kıbrıs bölünmüş ada; Kıbrıs Türkleri ayrıca not edilmeli.
**Görsel ortaklık:** Ilıman (kuzeyde soğuk, güneyde Akdeniz). Avrupa'da tarihî kent merkezleri, apartmanlar, tren ve tramvay; Kuzey Amerika'da banliyö evleri, geniş yollar, büyük arabalar, okul otobüsü. Modern günlük giyim.

## R13 · Doğu Avrupa ve Balkanlar (sosyalizm sonrası)
**Ülkeler:** POL, CZE, SVK, HUN, SVN, HRV, BIH, SRB, MNE, MKD, ALB, XKX (Kosova; veri dosyasında `OWID_KOS`, eşleme: `content/regions/kod-eslemeleri.json`), ROU, BGR, EST, LVA, LTU, MDA, UKR, BLR, RUS
**Ad hakkında:** Bölge adında tek bir ülke öne çıkarılmaz (Kalite bulgusu 2.6); ortak payda 20. yüzyıldaki sosyalist yönetim deneyimi.
**Neden bir arada:** 20. yüzyılda sosyalist yönetim deneyimi ve 1989-1991 sonrası geçiş dönemi (özelleştirme, işsizlik, Batı'ya göç); Slav, Baltık, Macar, Romen dilleri; Ortodoks, Katolik ve Müslüman (Bosna, Arnavutluk, Kosova) topluluklar; hızla küçülen ve yaşlanan nüfuslar; Balkanlar'da Osmanlı mirası (Türkiye ile ortak yemek ve kelimeler).
**İç farklar:** AB üyeleri (Polonya, Çekya, Baltıklar vb.) ile AB dışı ülkeler arasında gelir farkı; 1990'lar Yugoslavya savaşları; 2022 sonrası Rusya-Ukrayna savaşı (Ukrayna hayatlarında yerinden edilme). Rusya'nın içinde çok etnikli cumhuriyetler (Tatar, Başkurt, Çeçen vb.) ve Sibirya ile Moskova arasındaki fark. Kosova'da Arnavut çoğunluk ve Sırp topluluk; ülkenin tanınması tartışmalı, metinlerde tarafsız ad ("Kosova") kullanılır.
**Görsel ortaklık:** Karasal: uzun soğuk kış, kar. Sosyalist dönem panel apartman blokları (en güçlü ortak görsel), kent dışında yazlık bahçe evleri (daça), kırsalda ahşap ve tuğla evler; tramvay, troleybüs, metro, eski ve yeni otomobiller. Giyim kentte modern günlük giyim; kışın kalın mont ve paltolar, kırsalda yaşlı kadınlarda başörtüsü görülebilir. Yeni AB ülkelerinin kentlerinde cam ofis binaları ve yenilenmiş tarihî merkezler.

---

## Bilerek verilen zor kararlar (Kalite ve Atakan için)
1. **Türkiye R07'de**, Balkanlar (R13) ya da Akdeniz (R12) değil. Gerekçe: dil (Türk dilleri), din, aile yapısı ve konut bakımından en çok Kafkasya-İran-Orta Asya ile ortaklık. Ama Türkiye K1 olduğu için kendi profili zaten bu farkları taşır.
2. **İsrail R06'da**, kendi alt profiliyle. Alternatif: R12'ye almak. Açık soru.
3. **Sudan R02'de** (Sahel), R06'da değil. Kuzey Sudan Arapça konuşur ama Sahel ile kuraklık, göçebelik ve çatışma örüntüsünü paylaşır.
4. **Afganistan R07'de**, R08'de değil (BM sınıflamasında Güney Asya). Gerekçe: Dari (Farsça) ve Orta Asya ile ortak konut ve yemek kültürü. Peştun bağı R08 ile not edildi.
5. **Kafkasya ve Orta Asya R07'de**, R13'te değil. Sovyet mirası bir alt kit olarak taşınacak.
6. **Kuzey Amerika ve Okyanusya R12'de** Avrupa ile. Sayıyı 13'te tutmak için; alt kit ayrımı yapılıyor.
7. **Madagaskar R05'te**, Avustronezya kökenine rağmen. Gerekçe: Afrika ekonomik ve tarihî bağları; dil farkı şablonda not edildi.
