// "Bir Ömür" sohbet demosu: YKS yılı içeriği (Eylül → Ağustos).
// Satır biçimi: "kim: metin". ~ sesli mesaj, #foto:id altyazı, #kart:id|yazı, #sonuc:id|yazı.
// {ad} değişken, {g:erkek|kız} oyuncunun cinsiyeti, [a|b] tekrar etmeyen varyasyon.
// Not: Bu demoda istatistik yok. Netler ve puan karakterin kendi (kurgu) sonuçlarıdır.
import { icerikYukle, type Beat, type S, type Opt, type ChatId } from "./motor";

/* ---------- yardımcılar ---------- */
const ilgiStage = (s: S) => (s.f.sevgili && !s.f.ayrildi ? 3 : s.f.yakin ? 2 : s.bond.ilgi >= 35 ? 1 : 0);
const kankaIyi = (s: S) => !!(s.f.yaninda || s.f.notAt || s.f.babaSordu);
const fmtNet = (n: number) => {
  const q = Math.round(n * 4) / 4;
  const [a, b] = q.toFixed(2).split(".");
  return `${a},${b}`;
};
const SEHIR: Record<string, { de: string; e: string; i: string }> = {
  "İstanbul": { de: "İstanbul'da", e: "İstanbul'a", i: "İstanbul'u" },
  "Ankara": { de: "Ankara'da", e: "Ankara'ya", i: "Ankara'yı" },
  "İzmir": { de: "İzmir'de", e: "İzmir'e", i: "İzmir'i" },
  "Eskişehir": { de: "Eskişehir'de", e: "Eskişehir'e", i: "Eskişehir'i" },
  "Trabzon": { de: "Trabzon'da", e: "Trabzon'a", i: "Trabzon'u" },
  "Sivas": { de: "Sivas'ta", e: "Sivas'a", i: "Sivas'ı" },
};
const ALT: Record<string, { orta: string; dusuk: string }> = {
  "Bilgisayar Mühendisliği": { orta: "Matematik", dusuk: "Bilgisayar Programcılığı" },
  "Tıp": { orta: "Hemşirelik", dusuk: "Tıbbi Laboratuvar Teknikleri" },
  "Endüstri Mühendisliği": { orta: "İstatistik", dusuk: "Lojistik" },
};
const IKI_YILLIK = new Set(Object.values(ALT).map((a) => a.dusuk));

function deneme(s: S, ceza = 0): number {
  return Math.max(9, Math.min(116, 30 + s.study * 1.6 + s.rng.int(-60, 60) / 10 - ceza));
}

/* ---------- ay başı hesapları ---------- */
const MONTH_START: Record<number, (s: S) => void> = {
  0: (s) => {
    const c = SEHIR[s.k.ilgiSehir];
    Object.assign(s.f, { sehirDe: c.de, sehirE: c.e, sehirI: c.i });
  },
  2: (s) => {
    s.f.netSayi = deneme(s);
    s.f.net = fmtNet(s.f.netSayi);
    s.f.etutNet = fmtNet(s.f.netSayi + s.rng.int(8, 22));
    s.f.kankaNet = fmtNet(Math.max(14, s.f.netSayi - s.rng.int(4, 14)));
  },
  4: (s) => {
    s.f.netSayi = deneme(s);
    s.f.net = fmtNet(s.f.netSayi);
    if (!s.f.hedef) s.f.hedef = "Endüstri Mühendisliği";
  },
  6: (s) => {
    s.f.netSayi = deneme(s, 7); // Mart: herkesin düştüğü deneme
    s.f.net = fmtNet(s.f.netSayi);
  },
  8: (s) => {
    s.f.netSayi = deneme(s);
    s.f.net = fmtNet(s.f.netSayi);
    s.f.etutNet = fmtNet(Math.min(112, s.f.netSayi + s.rng.int(-6, 18)));
  },
  10: (s) => {
    const sans = s.rng.int(-35, 35);
    s.f.sans = sans;
    const puan = Math.max(150, Math.min(548, 150 + s.study * 6.5 + sans + s.rng.next()));
    s.f.puanSayi = puan;
    s.f.puan = puan.toFixed(2).replace(".", ",");
    s.f.tier = puan >= 420 ? "yuksek" : puan >= 340 ? "orta" : puan >= 265 ? "dusuk" : "yetersiz";
    const alt = ALT[s.f.hedef] ?? ALT["Endüstri Mühendisliği"];
    s.f.altOrta = alt.orta;
    s.f.altDusuk = alt.dusuk;
    s.f.uzak = s.k.ilgiSehir === "Ankara" ? "İzmir" : "Ankara";
    s.f.uzakDe = SEHIR[s.f.uzak].de;
    // arkadaşların yılı da sana biraz bağlı
    s.f.kankaSonuc = s.f.kankaKurs || s.f.notAt ? "iyi" : s.f.yaninda || s.f.babaSordu ? "orta" : "kotu";
    s.f.etutSonuc = s.f.etutYurudu ? "dis" : s.rng.chance(0.5) ? "dis" : "tekrar";
  },
  11: (s) => {
    const t = s.f.tercih as { tip: string; prog: string; sehir: string } | undefined;
    if (!t || t.tip === "tekrar" || t.tip === "is") {
      s.f.yerProg = "";
      s.f.yerSehir = "İstanbul";
      return;
    }
    let prog = t.prog;
    let sehir = t.sehir;
    if (s.rng.chance(0.2)) {
      s.f.kaydi = 1;
      if (s.f.tier === "yuksek") prog = s.f.altOrta;
      else if (s.f.tier === "orta") prog = prog === s.f.altOrta ? s.f.altDusuk : s.f.altOrta;
      else prog = "";
    }
    s.f.yerProg = prog;
    s.f.yerSehir = sehir;
    s.f.yerSehirDe = SEHIR[sehir].de;
    s.f.ayni = s.f.sevgili && !s.f.ayrildi && prog && sehir === s.k.ilgiSehir ? 1 : 0;
  },
};

/* ---------- beatler ---------- */
const B: Beat[] = [];
const add = (b: Beat) => B.push(b);

/* ===== EYLÜL ===== */
add({
  id: "e_aile", m: 0, chat: "aile", at: 0, saat: "07:12",
  lines: [
    "anne: Günaydın {oglum}. Kahvaltı hazır, yumurtan rafadan. Son sene, ilk gün. Yemeden çıkmak yok.",
    "anne: #foto:kahvalti",
    "baba: 👍",
    "teyze: Allah utandırmasın yavrum, bu sene senin senen 🌹🌹🌹",
    "kardes: {hitap} benim pergeli sen mi aldın",
  ],
  ask: {
    unread: -3, seen: -5,
    opts: [
      { say: "tamam anne 💛", fx: { b: { anne: 6 } }, then: ["anne: Afiyet olsun. Akşam köfte var 🙂"] },
      { say: "pergel bende değil. annemin çantasına bak", fx: { b: { kardes: 7, anne: 2 } }, then: ["kardes: buldum 🙄", "anne: Benim çantamda ne arıyor bu?", "kardes: sen koydun anne"] },
      { say: "amin teyzecim 🌹", fx: { b: { teyze: 8, anne: 3 } }, then: ["teyze: Maşallah maşallah 🧿 kuzum benim", "anne: 🙂"] },
    ],
  },
});
add({
  id: "e_kanka", m: 0, chat: "kanka", at: 0.15, saat: "07:31",
  lines: ["kanka: uyandın mı", "kanka: son sene diyolar ama ben hiç hissetmiyorum {g:lan|kızım}", "kanka: cuma okuldan sonra sahile inelim mi. son rahat cuma. söz"],
  ask: {
    seenLine: "kanka: görüldü attın bi de 😐",
    opts: [
      { say: "inelim. simit benden", fx: { b: { kanka: 8 }, st: -1 }, then: ["kanka: işte bu 🫡", "kanka: {c0} da geliyo, itiraz yok"] },
      { say: "cuma kursun tanışma günü var ya", fx: { b: { kanka: 1 }, st: 1 }, then: ["kanka: ha doğru", "kanka: tamam bi dahakine. ama bi dahaki gerçekten olcak"] },
    ],
  },
});
add({
  id: "e_sinif", m: 0, chat: "sinif", at: 0.3, saat: "16:40",
  lines: [
    "c0: ARKADAŞLAR SON SENE 🦅🦅🦅",
    "c1: Arkadaşlar grubu duyurular için açtık, lütfen gereksiz mesaj atmayalım",
    "c2: duyuru: son seneyiz 🦅",
    "c3: kim hangi kursa yazıldı",
    "c4: ben yazılmadım. bi sene kendi kendime çalışcam",
    "c0: KENDİ KENDİNE ÇALIŞAN GÖRMEDİM {c4} 😂",
    "c2: @{ad} sen napıyon kursa mı gidiyon",
  ],
  ask: {
    unread: -2, seen: -3,
    opts: [
      { say: "kurs + etüt. size veda ediyorum 🫡", fx: { b: { sinif: 4 } }, then: ["c2: baştan kaybettin 😔", "c1: Bence çok doğru karar 👏"] },
      { say: "ben de kafa dinlicem 😎", fx: { b: { sinif: 6 }, st: -1, set: { rahat: 1 } }, then: ["c4: işte 🤝", "c1: Arkadaşlar..."] },
    ],
  },
});
add({
  id: "e_etut", m: 0, chat: "etut", at: 0.45, saat: "19:05",
  lines: [
    "etut: selam ben {etut}, kurstan. aynı etüt grubundayız galiba",
    "etut: program geldi: pzt çrş cuma 18.00-21.30, cumartesi deneme",
    "etut: bu arada hedefin ne? ben tıp. ailem değil ben istiyorum, onu da diyim 😅",
  ],
  ask: {
    ignoreFx: { set: { hedef: "Endüstri Mühendisliği" } },
    opts: [
      { say: "bilgisayar mühendisliği", fx: { b: { etut: 5 }, set: { hedef: "Bilgisayar Mühendisliği" } }, then: ["etut: güzel. matematiğin iyiyse olur o iş", "etut: cumartesi denemede görüşürüz 👋"] },
      { say: "ben de tıp galiba. galiba.", fx: { b: { etut: 7 }, set: { hedef: "Tıp" } }, then: ["etut: rakip miyiz şimdi 😄", "etut: şaka şaka. beraber çalışırız"] },
      { say: "bilmiyorum ki ya", fx: { b: { etut: 4 }, set: { hedef: "Endüstri Mühendisliği", kararsiz: 1 } }, then: ["etut: dürüst cevap 👍", "etut: çoğu kişi bilmiyo aslında, sadece söylemiyo"] },
    ],
  },
});
add({
  id: "e_ilgi", m: 0, chat: "ilgi", at: 0.65, saat: "21:48", fx: { set: { ilgiTanisti: 1 } },
  lines: [
    "ilgi: selam 🙂 ben {ilgi}, kursta arka sıradayım",
    "ilgi: {etut} numaranı verdi. ilk dersin fizik notlarını sen tutmuşsun, fotoğrafını atabilir misin? ben yarıda geldim 🙈",
  ],
  ask: {
    unread: -10, seen: -14, seenLine: "ilgi: tamam sorun değil, başkasından alırım 🙂",
    opts: [
      { say: ["tabi, atıyorum", "#foto:notlar"], fx: { b: { ilgi: 18 } }, then: ["ilgi: hayatımı kurtardın", "ilgi: yazın da çok düzgünmüş. ben yazınca hiyeroglife dönüyo"] },
      { say: ["atarım ama bi şartla: bi dahakine sen tut 😄", "#foto:notlar"], fx: { b: { ilgi: 16 } }, then: ["ilgi: anlaştık 🤝", "ilgi: ama benimkini okuyamazsan karışmam"] },
    ],
  },
});

/* ===== EKİM ===== */
add({
  id: "ek_patron", m: 1, chat: "patron", at: 0.05, saat: "11:20",
  lines: [
    "patron: Selam {ad}, ben {patron}. Moda'daki kafe. {kanka} numaranı verdi.",
    "patron: Hafta sonu 10-18 arası birine ihtiyacım var. Haftalık ödüyorum, yemek bizden.",
    "patron: Sınav senen olduğunu biliyorum, o yüzden sadece hafta sonu. Düşün, bana dönersin.",
  ],
  ask: {
    unread: -4, seen: -6,
    opts: [
      { say: "başlarım abi", fx: { b: { patron: 10 }, pa: 1, set: { is: 1, isOldu: 1 } }, then: ["patron: Süper. Cumartesi 9.45'te kapıda ol, önlüğü ben veririm.", "patron: Kahve yapmayı bilmiyorsan dert etme, öğretirim"] },
      { say: "bu sene olmaz abi, sağ ol", fx: { b: { patron: 3 } }, then: ["patron: Haklısın. Sınavdan sonra kapımız açık 👍"] },
    ],
  },
});
add({
  id: "ek_aile", m: 1, chat: "aile", at: 0.2, saat: "18:02",
  lines: [
    "anne: ~ {oglum} bak şimdi, {teyze} teyzenin komşusunun kızı var ya, hani geçen sene tıp kazandı. Onunla konuştum bugün. Her gün yüz soru çözmüş, telefonunu da annesine vermiş akşamları. Ben bir şey demiyorum, sadece söylüyorum. Akşam yemekte konuşuruz.",
    "teyze: O kızı tanırım, çok çalışkandır maşallah 🌹",
    "kardes: anne telefonunu bana versin o zaman 😇",
  ],
  ask: {
    who: "anne", unread: -4, seen: -6, seenLine: "anne: Görüyorsun ama yazmıyorsun. Neyse.",
    opts: [
      { say: "tamam anne, deneyeyim", fx: { b: { anne: 6 }, st: 1 }, then: ["anne: Telefonunu bana vermene gerek yok, ben sana güveniyorum ❤️", "kardes: ben güvenmiyorum"] },
      { say: "anne herkesle kıyaslamasan", fx: { b: { anne: -1, baba: 3 }, set: { kiyas: 1 } }, then: ["anne: Kıyaslamıyorum ki. Sadece söyledim.", "baba: Tamam tamam. Akşam konuşuruz 🙂"] },
    ],
  },
});
add({
  id: "ek_kanka", m: 1, chat: "kanka", at: 0.35, saat: "23:14",
  lines: ["kanka: bişey diycem", "kanka: babam bugün öğlen eve geldi. hiç gelmez öğlen", "kanka: annemle mutfağa girdiler, kapıyı kapattılar. kimse bana bişey söylemiyo"],
  ask: {
    seenLine: "kanka: neyse önemli değil",
    opts: [
      { say: "iyi misin? ne olmuş ki", fx: { b: { kanka: 10 }, set: { kankaBiliyor: 1 } }, then: ["kanka: bilmiyorum. iyiyim galiba", "kanka: belki boş bişeydir. sağol ya"] },
      { say: "büyük ihtimal iş stresi, takma", fx: { b: { kanka: 3 } }, then: ["kanka: heh. öyledir"] },
    ],
  },
});
add({
  id: "ek_ilgi", m: 1, chat: "ilgi", at: 0.5, if: (s) => s.bond.ilgi >= 35,
  lines: ["ilgi: bugün etüde gelmedin 👀", "ilgi: bu sefer notları ben tuttum. hiyeroglif ama olsun", "ilgi: #foto:notlar2"],
  ask: {
    unread: -10, seen: -13,
    opts: [
      { say: "okuyabiliyorum valla. ödeşmek için çay benden?", fx: { b: { ilgi: 14 }, set: { cay: 1 } }, then: ["ilgi: kabul 😌", "ilgi: ama kursun kantininde değil. oranın çayı çay değil"] },
      { say: "kurtardın, sağ ol 🙏", fx: { b: { ilgi: 7 } }, then: ["ilgi: rica ederim 🙂"] },
    ],
  },
});
add({
  id: "ek_sinif", m: 1, chat: "sinif", at: 0.65, saat: "22:10",
  lines: [
    "c1: Arkadaşlar rehber öğretmen {rehber} Hoca herkesle tek tek görüşecekmiş, listeyi yarın panoya asıyorum",
    "c0: BENİ EN SONA YAZ",
    "c2: rehberci geçen sene bana 'sen hayal kur yeter' dedi hâlâ çözemedim",
    "c3: yarına ödev var mıydı",
    "c1: Yok.",
    "c3: emin misin",
    "c1: {c3}.",
  ],
});
add({
  id: "ek_rehber", m: 1, chat: "rehber", at: 0.8, saat: "10:05",
  lines: [
    "rehber: Merhaba {ad}, ben {rehber} Hoca, rehberlik servisinden.",
    "rehber: Görüşmen perşembe 4. ders. Bir şey hazırlamana gerek yok, sadece biraz konuşacağız.",
    "rehber: Mesai dışında geç dönebilirim, kusura bakma 🙂",
  ],
  ask: {
    unread: -4, seen: -5,
    opts: [
      { say: "tamam hocam, gelirim", fx: { b: { rehber: 6 } }, then: ["rehber: Görüşürüz 👋"] },
      { say: "hocam benim her şey yolunda aslında", fx: { b: { rehber: 3 } }, then: ["rehber: Buna çok sevinirim. Yine de uğra, bir çay içeriz."] },
    ],
  },
});

/* ===== KASIM ===== */
add({ id: "k_kurs", m: 2, chat: "kurs", at: 0, saat: "14:00", lines: ["sys: #sonuc:deneme|TYT Genel Deneme 1\nNet: {net}"] });
add({
  id: "k_sinif", m: 2, chat: "sinif", at: 0.15, saat: "22:41",
  lines: ["c0: KİM KAÇ YAPTI", "c2: ben 31 💀", "c4: söylemiyorum ama iyi değil", "c3: türkçede 4 boş bırakmışım nasıl olur ya", "kanka: {kankaNet}. sormayın", "c0: @{ad} SEN?"],
  ask: {
    unread: -2, seen: -4,
    opts: [
      { say: "{net} 🙃", fx: { b: { sinif: 4 } }, then: (s) => (s.f.netSayi >= 55 ? ["c0: OHA", "c2: kanka sen artık bizden değilsin"] : ["c2: kardeşim 🤝", "c0: BİZ BİR AİLEYİZ"]) },
      { say: "söylemem 🤐", fx: { b: { sinif: 1 } }, then: ["c0: SÖYLEMEYEN YÜKSEK YAPMIŞTIR", "c2: ya da çok düşük", "c2: iki ihtimal var yani"] },
    ],
  },
});
add({
  id: "k_etut", m: 2, chat: "etut", at: 0.3,
  lines: ["etut: {etutNet} yaptım. matematikte 6 boş 😤", "etut: sen?"],
  ask: {
    seenLine: "etut: ok",
    opts: [
      { say: "{net}. yolun başındayız daha", fx: { b: { etut: 4 } }, then: ["etut: aynen. kasım daha", "etut: haziran çok uzak gibi ama değil diyolar. sevmiyorum bu cümleyi"] },
      { say: "pazar kütüphane? beraber soru çözelim", fx: { b: { etut: 10 }, st: 2 }, then: ["etut: olur! 10'da kütüphanenin önünde", "etut: geç kalan çay ısmarlar"] },
    ],
  },
});
add({
  id: "k_anne", m: 2, chat: "anne", at: 0.45, saat: "20:15",
  lines: ["anne: Deneme nasıl geçti? Baban da sordu ama sana yazmaya çekiniyor 🙂"],
  ask: {
    unread: -5, seen: -7, seenLine: "anne: Okudun ama cevap yok. Merak ediyorum sadece.",
    opts: [
      { say: "iyi geçti anne", fx: { b: { anne: 5 }, run: (s) => { if (s.f.netSayi < 55) s.f.yalan = 1; } }, then: ["anne: Şükürler olsun. Akşam en sevdiğin yemeği yapıyorum"] },
      { say: "{net} net anne. daha başındayız", fx: { b: { anne: 4 } }, then: ["anne: Tamam {oglum}. Sen elinden geleni yap, gerisi bizde."] },
      { say: "konuşmak istemiyorum şu an", fx: { b: { anne: -2 } }, then: ["anne: Peki. Ama kapını kapatma, kapalı kapı beni korkutuyor."] },
    ],
  },
});
add({
  id: "k_ilgi", m: 2, chat: "ilgi", at: 0.6, if: (s) => !!s.f.cay,
  lines: ["ilgi: cumartesi denemeden sonra o çay? 🙂", "ilgi: moda'da bi yer biliyorum, deniz görüyo. sınavı bi saat unuturuz"],
  ask: {
    unread: -12, seen: -15,
    opts: [
      { say: "olur. denemeden sonra kapıda bekle", fx: { b: { ilgi: 15 }, st: -1, set: { yakin: 1 } }, then: ["ilgi: 🫶", "ilgi: bu arada netini sormıycam. sen de sorma"] },
      { say: "bu cumartesi olmaz, sonra?", fx: { b: { ilgi: 1 } }, then: ["ilgi: tamam, sonra 🙂"] },
    ],
  },
});
add({
  id: "k_ilgi_b", m: 2, chat: "ilgi", at: 0.6, if: (s) => !s.f.cay && s.bond.ilgi >= 35,
  lines: ["ilgi: deneme kitabı aldım, fizik bölümü çok iyi. bitirince sana vereyim mi?"],
  ask: {
    unread: -10, seen: -12,
    opts: [{ say: "çok iyi olur. karşılığında çay benden", fx: { b: { ilgi: 12 }, set: { cay: 1 } }, then: ["ilgi: anlaştık ☕"] }],
  },
});
add({ id: "k_rehber", m: 2, chat: "rehber", at: 0.75, if: (s) => s.bond.rehber >= 50, lines: ["rehber: {ad}, denemeni gördüm. Tek denemeye bakıp bir şey söylemem. Sadece uykuna dikkat et, gerisi gelir."] });
add({ id: "k_patron", m: 2, chat: "patron", at: 0.85, if: (s) => !!s.f.is, fx: { pa: 1 }, lines: ["patron: Haftalığın yattı 💸", "patron: Pazar günü süt köpürtmen fena değildi bu arada. Kalp yapamıyorsun ama 😄"] });

/* ===== ARALIK ===== */
add({
  id: "a_cuma", m: 3, chat: "aile", at: 0, saat: "08:03",
  lines: ["teyze: #kart:cuma|Hayırlı Cumalar", "teyze: 🌹🌹🌹", "anne: Amin 🤲", "baba: Amin"],
  ask: {
    who: "teyze", unread: -2, seen: -3,
    opts: [{ say: "amin teyzecim 🌹", fx: { b: { teyze: 8, anne: 2 } }, then: ["teyze: Kuzum 😘 sınavın ne zaman?", "anne: Haziranda, söyledim ya 🙂"] }],
  },
});
add({
  id: "a_kanka", m: 3, chat: "kanka", at: 0.2, saat: "22:51",
  lines: (s) => [
    s.f.kankaBiliyor ? "kanka: hatırlıyo musun babam öğlen eve gelmişti" : "kanka: müsait misin",
    "kanka: babamın çalıştığı yer kapanmış. aylardır maaşları yatmıyomuş, bize söylememişler",
    "kanka: annem mutfakta ağlıyo. ben odadayım. ne yapcağımı bilmiyorum",
  ],
  ask: {
    unread: -16, seen: -20, seenLine: "kanka: tamam. yoğunsundur",
    opts: [
      { say: "geliyorum. 15 dk", cost: 2, fx: { b: { kanka: 22 }, set: { yaninda: 1 } }, then: ["kanka: gelme ya gerek yok", "kanka: ...", "kanka: tamam gel. aşağıdayım"] },
      { say: "çok üzüldüm kanka. ne lazımsa buradayım", fx: { b: { kanka: 10 } }, then: ["kanka: biliyorum. sağol"] },
      { say: "babam bi tanıdığa sorsun mu, iş için?", fx: { b: { kanka: 12, baba: 2 }, set: { babaSordu: 1 } }, then: ["kanka: sorabilir mi gerçekten", "kanka: babam kimseden bişey istemez ama... sor bi"] },
    ],
  },
});
add({
  id: "a_sinif", m: 3, chat: "sinif", at: 0.35, saat: "23:20",
  lines: [
    "c1: Arkadaşlar yılbaşı çekilişi yapıyoruz 🎄 limit 250 TL, isimleri yarın dağıtıyorum",
    "c2: limit enflasyona endeksli mi",
    "c0: BANA ÇORAP ALAN OLURSA KÜSERİM",
    "c4: ben bu sene katılmıyorum ya",
    "c1: {c4} lütfen 🥲",
  ],
  ask: {
    unread: -1, seen: -2,
    opts: [
      { say: "ben varım 🎁", fx: { b: { sinif: 5 } }, then: ["c1: Yazdım seni 🙌"] },
      { say: "@{c4} katıl ya, son sene", fx: { b: { sinif: 6 } }, then: ["c4: tamam tamam", "c4: ama çorap alcam"] },
    ],
  },
});
add({
  id: "a_patron", m: 3, chat: "patron", at: 0.5, if: (s) => !!s.f.is,
  lines: ["patron: {ad}, yılbaşı haftası çok yoğun. Pazar da gelebilir misin? Ekstrasını veririm."],
  ask: {
    seenLine: "patron: Başkasını bulurum, sorun değil.",
    opts: [
      { say: "gelirim abi", fx: { b: { patron: 8 }, pa: 2, st: -1 }, then: ["patron: Eyvallah. Sana bir dilim cheesecake ayırdım, haberin olsun"] },
      { say: "abi o pazar deneme var, olmaz", fx: { b: { patron: -2 } }, then: ["patron: Tamam, ders önce."] },
    ],
  },
});
add({
  id: "a_ilgi", m: 3, chat: "ilgi", at: 0.65, if: (s) => !!s.f.yakin,
  lines: ["ilgi: yılbaşı ne yapıyosun? 🎄", "ilgi: bizimkiler teyzemlere gidiyo. ben ders bahanesiyle evde kalıyorum 😇"],
  ask: {
    unread: -12, seen: -15,
    opts: [
      { say: "bi saatliğine çıkalım mı? kalabalıktan uzak bi yere", fx: { b: { ilgi: 15 }, st: -1, set: { yilbasi: 1 } }, then: ["ilgi: olur 🙂", "ilgi: #foto:deniz", "ilgi: geçen hafta çektim burayı. seni oraya götürücem"] },
      { say: "evde, ders 😐", fx: { b: { ilgi: 2 } }, then: ["ilgi: aynen 😐 ikimiz de"] },
    ],
  },
});
add({
  id: "a_ilgi_b", m: 3, chat: "ilgi", at: 0.65, if: (s) => !s.f.yakin && s.bond.ilgi >= 35,
  lines: ["ilgi: yılbaşı ders mi? 😄 kursta herkes plan yapıyo. ben de 'ders' diyorum, kimse inanmıyo"],
  ask: {
    unread: -10, seen: -12,
    opts: [{ say: "aynen, ben de ders. ama o çay hâlâ borcum", fx: { b: { ilgi: 12 }, set: { cay: 1, yakin: 1 } }, then: ["ilgi: borcunu unutmadın yani 🙂", "ilgi: ocakta tahsil ediyorum"] }],
  },
});
add({
  id: "a_sofra", m: 3, chat: "aile", at: 0.8, saat: "20:12",
  lines: ["anne: #foto:sofra", "anne: Mercimek çorbası yaptım. Soğumadan gel {oglum}, iki saattir masadasın", "kardes: {hitap} gelmezsen çorbanı ben içerim"],
  ask: {
    who: "anne", unread: -3, seen: -5, seenLine: "anne: Tabağını odana bıraktım.",
    opts: [{ say: "geliyorum 🍲", fx: { b: { anne: 5, kardes: 4 } }, then: ["kardes: geç kaldın ben içtim 😋", "anne: İçmedi, yalan söylüyor 😄"] }],
  },
});

/* ===== OCAK ===== */
add({ id: "o_kurs", m: 4, chat: "kurs", at: 0, saat: "14:00", lines: ["sys: #sonuc:deneme|TYT Genel Deneme 2\nNet: {net}"] });
add({
  id: "o_baba", m: 4, chat: "baba", at: 0.15, saat: "12:47",
  lines: (s) =>
    s.f.babaSordu
      ? ["baba: Arkadaşın {kanka} var ya. Babası için sordum. Bizim depoda bir yer var, sigortalı. Numarasını verdim, yarın gidecek.", "baba: Sen iyi arkadaşsın {oglum}."]
      : ["baba: Karne günü. Ne olursa olsun akşam künefe yiyoruz.", "baba: Annene söyleme, sürpriz 🤫"],
  ask: {
    unread: -4, seen: -5,
    opts: (s) =>
      s.f.babaSordu
        ? [{ say: "sağ ol baba ❤️", fx: { b: { baba: 8 }, set: { kankaKurs: 1 } }, then: ["baba: 👍"] }]
        : [
            { say: "😂 tamam baba", fx: { b: { baba: 8 } }, then: ["baba: 👍"] },
            { say: "notlar biraz kötü baba", fx: { b: { baba: 7 } }, then: ["baba: Künefe nota bakmaz. Akşam görüşürüz."] },
          ],
  },
});
add({
  id: "o_kanka", m: 4, chat: "kanka", at: 0.3, if: (s) => !s.f.babaSordu, saat: "21:33",
  lines: ["kanka: kursu bıraktım", "kanka: dayımın dükkanında çalışcam akşamları. telefon tamiri", "kanka: sınava girerim yine de. belki"],
  ask: {
    unread: -12, seen: -15, seenLine: "kanka: ok",
    opts: [
      { say: "notlarımı her hafta atarım sana. bırakma", fx: { b: { kanka: 12 }, set: { notAt: 1 } }, then: ["kanka: atmazsın", "kanka: ...", "kanka: sağol {g:lan|kızım}. cidden"] },
      { say: "bence yanlış yapıyosun", fx: { b: { kanka: -6 } }, then: ["kanka: senin baban maaş alıyo ama", "kanka: kusura bakma. öyle demek istemedim"] },
      { say: "anlıyorum. dükkana uğrarım", fx: { b: { kanka: 8 } }, then: ["kanka: gel. ekran koruyucun bedava 😄"] },
    ],
  },
});
add({
  id: "o_kanka_b", m: 4, chat: "kanka", at: 0.3, if: (s) => !!s.f.babaSordu, saat: "21:33",
  lines: ["kanka: babam depoda başladı 🙏 baban sağolsun", "kanka: annem 'gelsinler yemeğe' diyo. söylemedi deme", "kanka: ben de kursa devam. şimdilik"],
  ask: { opts: [{ say: "çok sevindim kanka 🤍", fx: { b: { kanka: 8 } }, then: ["kanka: ben de. çok"] }] },
});
add({
  id: "o_etut", m: 4, chat: "etut", at: 0.45,
  lines: ["etut: sömestrde kütüphane kampı yapıyoruz. her gün 9-21. 4 kişiyiz", "etut: var mısın?"],
  ask: {
    opts: [
      { say: "varım", fx: { b: { etut: 10 }, st: 3, set: { kampAy: 5 } }, then: ["etut: süper. öğle arası lahmacun, tek kural bu"] },
      { say: "biraz nefes alcam, sonra katılırım", fx: { b: { etut: 1 } }, then: ["etut: tamam ama nefes kısa olsun 😄"] },
    ],
  },
});
add({
  id: "o_ilgi", m: 4, chat: "ilgi", at: 0.6, if: (s) => ilgiStage(s) >= 1, saat: "01:34",
  lines: ["ilgi: ~ uyuyamıyorum. saat bir buçuk. bi şey sorcam, gülme. sence sınavdan sonra ne olcak? herkes bi yere gidiyo ya. ben bunu hiç düşünmemiştim bugüne kadar."],
  ask: {
    unread: -10, seen: -13, unreadLine: "ilgi: uyumuşsundur. iyi geceler", seenLine: "ilgi: okudun ama 🙂 neyse. iyi geceler",
    opts: [
      { say: "bi şekilde hallederiz. şimdi uyu 🌙", fx: { b: { ilgi: 10 }, set: { yakin: 1 } }, then: ["ilgi: hallederiz dedin ama. kaydettim bunu 🙂"] },
      { say: "şimdi bunu düşünmeyelim", fx: { b: { ilgi: 3 } }, then: ["ilgi: haklısın. iyi geceler"] },
    ],
  },
});
add({
  id: "o_sinif", m: 4, chat: "sinif", at: 0.75, saat: "15:10",
  lines: ["c0: KARNEYİ EVE GÖTÜRMEYEN VAR MI SIĞINACAK YER ARIYORUM", "c3: karne ne zaman veriliyodu", "c1: Bugün {c3}.", "c2: {c3} karneyi aldı ama hâlâ ne zaman verildiğini soruyo 🫡", "c4: uyuyan var mı"],
});
add({
  id: "o_anne", m: 4, chat: "anne", at: 0.85, if: (s) => !!s.f.yalan,
  lines: ["anne: Kurs hocan aradı. Denemeler pek iyi değilmiş. Neden söylemedin bana?"],
  ask: {
    unread: -6, seen: -8,
    opts: [
      { say: "korktum anne", fx: { b: { anne: 8 } }, then: ["anne: Benden mi korktun? Ben senin annenim.", "anne: Gel mutfağa. Çay koyuyorum."] },
      { say: "abartıyolar", fx: { b: { anne: -4 } }, then: ["anne: Belki. Ama bana yalan söyleme, o kadar."] },
    ],
  },
});

/* ===== ŞUBAT ===== */
add({
  id: "s_ilgi", m: 5, chat: "ilgi", at: 0.1, if: (s) => !!s.f.yilbasi, saat: "08:14",
  lines: ["ilgi: bugün ne günü biliyo musun 🙂", "ilgi: kutlamıyoruz tabi. sadece soruyorum."],
  ask: {
    unread: -16, seen: -18, seenLine: "ilgi: tamam.",
    opts: [
      { say: "biliyorum. sana bi şey aldım", need: (s) => s.para >= 2, fx: { b: { ilgi: 20 }, pa: -2, set: { sevgili: 1 } }, then: ["ilgi: ne aldın", "ilgi: ...", "ilgi: kitap ayracı mı bu 😭 arkasına ne yazmışsın sen", "ilgi: tamam. resmen sevgiliyiz şu an. itiraz kabul etmiyorum"] },
      { say: "kutlamıyoruz ama... buna bi isim koyalım mı?", fx: { b: { ilgi: 18 }, set: { sevgili: 1 } }, then: ["ilgi: isim mi 😄", "ilgi: ...", "ilgi: tamam. koyalım 🙂"] },
      { say: "cumartesi deneme var ya 😅", fx: { b: { ilgi: -8 } }, then: ["ilgi: evet biliyorum. hep var"] },
    ],
  },
});
add({
  id: "s_ilgi_b", m: 5, chat: "ilgi", at: 0.1, if: (s) => !s.f.yilbasi && s.bond.ilgi >= 35,
  lines: ["ilgi: bi şey sorcam. cumartesi deneme yok. sinema?"],
  ask: {
    unread: -12, seen: -14,
    opts: [
      { say: "olur 🙂", fx: { b: { ilgi: 15 }, st: -1, set: { yilbasi: 1, yakin: 1 } }, then: ["ilgi: 🙂", "ilgi: film sen seç. korku olmasın ama"] },
      { say: "deneme yok ama açığım çok", fx: { b: { ilgi: -3 } }, then: ["ilgi: tamam, anlıyorum"] },
    ],
  },
});
add({
  id: "s_anne", m: 5, chat: "anne", at: 0.25, saat: "21:40",
  lines: (s) =>
    s.study >= 14
      ? ["anne: {oglum} yemeğe bile çıkmıyorsun odadan. Bir dakika gel, çay koydum. Sadece bir çay."]
      : ["anne: Kurs hocan aradı. Bu ay iki kere gitmemişsin? Bir şey mi oldu?"],
  ask: {
    unread: -5, seen: -7, seenLine: "anne: Merak ediyorum, o kadar.",
    opts: (s) =>
      s.study >= 14
        ? [
            { say: "geliyorum anne", fx: { b: { anne: 8 } }, then: ["anne: Simit de aldım 🙂"] },
            { say: "anne çok konu var", fx: { b: { anne: -1 } }, then: ["anne: Biliyorum. Çayını kapına bırakıyorum."] },
          ]
        : [
            { say: "yorgunum anne. çok yorgunum", fx: { b: { anne: 7 } }, then: ["anne: Biliyorum. Bu hafta sonu hiçbir şey yapma, ben izin veriyorum.", "anne: Babana da ben söylerim."] },
            { say: "gittim ya, karışıklık olmuştur", fx: { b: { anne: -3 } }, then: ["anne: Peki."] },
          ],
  },
});
add({
  id: "s_sinif", m: 5, chat: "sinif", at: 0.4, saat: "23:52",
  lines: ["c3: TÜREV ANLAYAN VAR MI ACİL", "c2: türev ne kanka", "c0: TÜREV BİR DUYGUDUR", "c1: Yarın ilk ders yazılı var bu arada", "c3: NE", "c3: @{ad} anlatır mısın 🙏 sesli at"],
  ask: {
    unread: -3, seen: -5,
    opts: [
      { say: "~ tamam bak, türev aslında bir şeyin ne kadar hızlı değiştiği. arabanın hızı gibi düşün. konum değişiyo, hız da o değişimin ne kadar hızlı olduğu. grafikte de o noktadaki eğim. yarın teneffüste kağıtta gösteririm", fx: { b: { sinif: 10 }, st: 1 }, then: ["c3: seni seviyorum", "c2: ben de anladım şu an, şoktayım", "c0: ARABA ÖRNEĞİ 🚗🔥"] },
      { say: "yarın teneffüste anlatırım", fx: { b: { sinif: 4 } }, then: ["c3: teneffüse kadar ölmezsem 🙏"] },
    ],
  },
});
add({
  id: "s_patron", m: 5, chat: "patron", at: 0.55, if: (s) => !!s.f.is,
  lines: ["patron: {ad}, sınav yaklaşıyor. Saatlerini azaltalım mı? İstersen sadece cumartesi gel."],
  ask: {
    unread: -1, seen: -2,
    opts: [
      { say: "bırakayım abi, sınavdan sonra dönerim", fx: { b: { patron: 6 }, set: { is: 0 } }, then: ["patron: Sınavdan sonra seni bekliyorum, unutma"] },
      { say: "devam abi, paraya ihtiyacım var", fx: { b: { patron: 4 }, pa: 2 }, then: ["patron: Tamam. Yorulursan söyle."] },
    ],
  },
});
add({
  id: "s_kanka", m: 5, chat: "kanka", at: 0.7, if: (s) => !!s.f.notAt,
  lines: ["kanka: notlarını dükkanda tezgâhın altında okuyorum 😄 müşteri gelince saklıyorum", "kanka: dayım gördü, 'oku oku' dedi. herkes beni okutmaya çalışıyo"],
  ask: { opts: [{ say: "dayına selam söyle 😄", fx: { b: { kanka: 6 } }, then: ["kanka: söyledim. 'o kim' dedi 😂"] }] },
});
add({
  id: "s_kanka_b", m: 5, chat: "kanka", at: 0.7, if: (s) => !s.f.notAt,
  lines: ["kanka: cumartesi akşam bizim mahallede maç var. gel be bi akşam", "kanka: aylardır doğru düzgün görmedim seni"],
  ask: {
    unread: -10, seen: -13, seenLine: "kanka: tamam. her ay aynı cevap zaten",
    opts: [
      { say: "geliyorum", fx: { b: { kanka: 12 }, st: -1 }, then: ["kanka: OHA. tamam. çay benden"] },
      { say: "bu ay olmaz kanka", fx: { b: { kanka: -3 } }, then: ["kanka: geçen ay da öyle demiştin"] },
    ],
  },
});
add({
  id: "s_aile", m: 5, chat: "aile", at: 0.85, saat: "17:22",
  lines: ["teyze: Cumartesi akşam iftara bekliyorum hepinizi, mazeret yok 🌙", "teyze: {ad} sen de geliyorsun, ders bir akşam bekler"],
  ask: {
    who: "teyze", unread: -3, seen: -4,
    opts: [
      { say: "geliyoruz teyze 🌙", fx: { b: { teyze: 6, anne: 3 }, st: -1 }, then: ["teyze: Sarma yaptım, sırf senin için 🥰"] },
      { say: "teyzecim ben bu sefer gelemem, kusura bakma", fx: { b: { teyze: -1 } }, then: ["teyze: Annene tabak koyarım, sen de yersin 🙂"] },
    ],
  },
});

/* ===== MART ===== */
add({ id: "m_kurs", m: 6, chat: "kurs", at: 0, saat: "14:00", lines: ["sys: #sonuc:deneme|TYT Genel Deneme 3\nNet: {net}"] });
add({
  id: "m_kardes", m: 6, chat: "kardes", at: 0.15, saat: "22:06",
  lines: ["kardes: {hitap}", "kardes: annemle babam biraz tartıştı. senin yüzünden değil merak etme", "kardes: para yüzünden galiba. kurs parası falan", "kardes: bi de matematik ödevim var. kesirler 😬 bakar mısın"],
  ask: {
    unread: -10, seen: -12, seenLine: "kardes: tamam sen de yoğunsun",
    opts: [
      { say: "gel odama, ikisine de bakarız", fx: { b: { kardes: 14 } }, then: ["kardes: geliyorum", "kardes: ödev bahane bu arada 🙂"] },
      { say: "kurs parasına ben de katkı yaparım. kafeden biriktirdim", need: (s) => s.para >= 2, fx: { b: { kardes: 10, anne: 6, baba: 6 }, pa: -2, set: { katki: 1 } }, then: ["kardes: ciddi misin", "kardes: annem duyunca ağlar bak"] },
      { say: "şu an olmaz, akşam bakarım", fx: { b: { kardes: 2 } }, then: ["kardes: tamam 👍"] },
    ],
  },
});
add({
  id: "m_etut", m: 6, chat: "etut", at: 0.3, saat: "23:41",
  lines: ["etut: ben çöktüm", "etut: 3 denemedir düşüyorum. annem bugün 'o kadar para verdik' dedi. dememeliydi bence", "etut: bıraksam mı diyorum. tıp falan. bilmiyorum"],
  ask: {
    unread: -12, seen: -14, seenLine: "etut: neyse boşver, kafamda kuruyorum",
    opts: [
      { say: "çıkalım biraz yürüyelim. kitap yok, soru yok", fx: { b: { etut: 15 }, set: { etutYurudu: 1 } }, then: ["etut: tamam", "etut: teşekkür ederim. cidden"] },
      { say: "herkes düşüyo bu aralar. bu deneme zordu", fx: { b: { etut: 5 } }, then: ["etut: umarım öyledir"] },
    ],
  },
});
add({
  id: "m_aile", m: 6, chat: "aile", at: 0.45, saat: "07:58",
  lines: ["teyze: #kart:bayram|Bayramınız Mübarek Olsun", "teyze: Bayramınız mübarek olsun canlarım 🌷🌷", "anne: Seninkini de kardeşim 🌷 Kahvaltıya bekliyoruz", "anne: #foto:bayram", "kardes: harçlıklar nerde"],
  ask: {
    who: "teyze", unread: -2, seen: -3,
    opts: [
      { say: "iyi bayramlar teyzecim 🌷 ellerinden öperim", fx: { b: { teyze: 8, anne: 3 } }, then: ["teyze: Gel gerçekten öp, harçlığın hazır 😄"] },
      { say: "@{kardes} ayıp ayıp", fx: { b: { kardes: 4 } }, then: ["kardes: sen de bekliyosun biliyorum"] },
    ],
  },
});
add({
  id: "m_ilgi", m: 6, chat: "ilgi", at: 0.6, if: (s) => ilgiStage(s) === 3,
  lines: ["ilgi: son zamanlarda hep 'deneme var' diyosun", "ilgi: anlıyorum. gerçekten. ben de çalışıyorum", "ilgi: ama bazen 5 dakika yazsan yeter. sadece 'buradayım' de"],
  ask: {
    unread: -18, seen: -22, seenLine: "ilgi: tamam. görüyorum.",
    opts: [
      { say: "buradayım.", fx: { b: { ilgi: 12 } }, then: ["ilgi: 🙂", "ilgi: işte bu kadar. bu kadarı yeter"] },
      { say: "haklısın, özür dilerim. pazar sadece senin", fx: { b: { ilgi: 15 }, st: -1 }, then: ["ilgi: pazar sabah 10. geç kalma"] },
    ],
  },
});
add({
  id: "m_ilgi_b", m: 6, chat: "ilgi", at: 0.6, if: (s) => ilgiStage(s) === 1 || ilgiStage(s) === 2,
  lines: ["ilgi: denemede seni gördüm. selam verecektim ama çok dalgındın 🙂"],
  ask: {
    unread: -8, seen: -10,
    opts: [{ say: "keşke verseydin. o deneme beni bitirdi", fx: { b: { ilgi: 10 } }, then: ["ilgi: herkesi bitirdi", "ilgi: bi dahakine dürterim"] }],
  },
});
add({
  id: "m_kanka", m: 6, chat: "kanka", at: 0.75, if: (s) => kankaIyi(s),
  lines: ["kanka: bugün eski matematikçi geldi dükkana. 'sınava girmiyo musun' dedi", "kanka: giricem hocam dedim. sesli söyleyince gerçek oldu sanki"],
  ask: { opts: [{ say: "girceksin. ben de yanındayım", fx: { b: { kanka: 8 } }, then: ["kanka: bunu bi kenara yazdım. unutmam"] }] },
});
add({
  id: "m_kanka_b", m: 6, chat: "kanka", at: 0.75, if: (s) => !kankaIyi(s),
  lines: ["kanka: bugün doğum günümdü bu arada 🙃"],
  ask: {
    unread: -14, seen: -18, seenLine: "kanka: 👍",
    opts: [
      { say: "unutmadım!! akşam ordayım, pasta benden", fx: { b: { kanka: 14 }, st: -1 }, then: ["kanka: unuttun ama 😄", "kanka: neyse gel"] },
      { say: "çok özür dilerim. iyi ki doğdun 🎂", fx: { b: { kanka: 4 } }, then: ["kanka: sağol"] },
    ],
  },
});

/* ===== NİSAN ===== */
add({
  id: "n_rehber", m: 7, chat: "rehber", at: 0.1,
  lines: ["rehber: {ad}, tercih dönemi gelmeden ailenle şehir konusunu konuşmanı öneririm. 'Burada mı, dışarıda mı' sorusu son haftaya kalınca çok zor oluyor.", "rehber: İstersen annenle beraber gelin, birlikte konuşuruz."],
  ask: {
    unread: -3, seen: -4,
    opts: [
      { say: "tamam hocam, konuşacağım", fx: { b: { rehber: 5 }, set: { sehirKonustu: 1 } }, then: ["rehber: 👍 Kolay gelsin."] },
      { say: "hocam bizimkiler beni hiçbir yere göndermez", fx: { b: { rehber: 5 } }, then: ["rehber: Belki de hiç sorulmadığı içindir. Sormadan bilemezsin."] },
    ],
  },
});
add({
  id: "n_aile", m: 7, chat: "aile", at: 0.25, saat: "20:31",
  lines: ["anne: Komşunun oğlu Eskişehir'de okuyor ya. Annesi her gece ağlıyormuş 😔", "baba: Çocuk gayet iyi ama. Ağlayan annesi.", "anne: Ben ağlamam. Ama sen de uzağa gitme.", "kardes: {hitap} giderse odası benim"],
  ask: {
    who: "anne", unread: -2, seen: -3,
    opts: [
      { say: "kimse bi yere gitmiyo daha 😄", fx: { b: { anne: 4, kardes: 3 } }, then: ["kardes: ama giderse"] },
      { say: "gidebilirim de anne. bölüme bakcam", fx: { b: { anne: -2, baba: 4 }, set: { uzakAcik: 1 } }, then: ["anne: ...", "baba: Doğru söylüyor. Hep beraber bakarız."] },
    ],
  },
});
add({
  id: "n_sinif", m: 7, chat: "sinif", at: 0.4, saat: "21:15",
  lines: ["c1: Arkadaşlar mezuniyet balosu için anket: kimler geliyor?", "c1: 📊 Evet 14 · Hayır 3 · Bilmiyorum 9", "c0: BALO DEMEYELİM MEZUNİYET ŞÖLENİ DİYELİM", "c2: ben takım elbise yerine eşofmanla gelicem, kimse durduramaz"],
  ask: { unread: -1, seen: -1, opts: [{ say: "evet'e bastım 🕺", fx: { b: { sinif: 5 } }, then: ["c0: İŞTE BU", "c2: eşofman ekibine katıl"] }] },
});
add({ id: "n_etut", m: 7, chat: "etut", at: 0.55, if: (s) => !!s.f.etutYurudu, lines: ["etut: bu deneme 9 net arttım", "etut: o yürüyüş işe yaradı galiba 😄"], ask: { opts: [{ say: "biliyordum 🙌", fx: { b: { etut: 5 } }, then: ["etut: sıradaki yürüyüş sınavdan sonra. uzun bi yürüyüş"] }] } });
add({ id: "n_etut_b", m: 7, chat: "etut", at: 0.55, if: (s) => !s.f.etutYurudu, lines: ["etut: bu ayın deneme takvimi 📎", "etut: cumartesi 9.30, geç kalan içeri alınmıyomuş artık"] });
add({
  id: "n_ilgi", m: 7, chat: "ilgi", at: 0.7, if: (s) => ilgiStage(s) === 3,
  lines: ["ilgi: annemler {sehir} diyo. orada teyzem var, onda kalırım diyolar", "ilgi: ben de istiyorum aslında. ama sen?"],
  ask: {
    unread: -10, seen: -13,
    opts: [
      { say: "bakarız. daha puanlar belli değil", fx: { b: { ilgi: 1 } }, then: ["ilgi: evet. bakarız"] },
      { say: "ben de {sehirE} bakarım", fx: { b: { ilgi: 10 }, set: { ilgiSoz: 1 } }, then: ["ilgi: ciddi misin", "ilgi: söz ama bak 🤙"] },
    ],
  },
});
add({
  id: "n_kanka", m: 7, chat: "kanka", at: 0.85,
  lines: ["kanka: eski fotoğraf buldum", "kanka: #foto:cocukluk", "kanka: 4. sınıf. senin elinde o mavi top var hatırlıyo musun"],
  ask: { unread: -4, seen: -6, opts: [{ say: "o top hâlâ bizim balkonda 😂", fx: { b: { kanka: 8 } }, then: ["kanka: yalan söyleme", "kanka: ciddi mi 😭"] }] },
});

/* ===== MAYIS ===== */
add({ id: "my_kurs", m: 8, chat: "kurs", at: 0, saat: "14:00", lines: ["sys: #sonuc:deneme|TYT Genel Deneme 4 (son)\nNet: {net}"] });
add({
  id: "my_sinif", m: 8, chat: "sinif", at: 0.15, saat: "13:05",
  lines: ["c1: Arkadaşlar yarın son gün 🥲 toplu fotoğraf var, beyaz tişört", "c0: SON GÜN 🦅😭", "c1: #foto:sinif", "c4: bu sınıfı özleyecem galiba. kimseye söylemeyin", "c2: ekran görüntüsü aldım {c4}"],
  ask: { unread: -1, seen: -2, opts: [{ say: "ben de özlicem. hepinizi. {c0} hariç 😄", fx: { b: { sinif: 6 } }, then: ["c0: BEN DE SENİ SEVİYORUM", "c4: 🥲"] }] },
});
add({
  id: "my_anne", m: 8, chat: "anne", at: 0.3, saat: "19:44",
  lines: ["anne: Bayramda memlekete gitmiyoruz bu sene. Sen rahat çalış diye. Teyzenler buraya gelecek.", "anne: Söylemeyecektim baskı olmasın diye. Ama söyledim işte 😅"],
  ask: {
    unread: -4, seen: -5,
    opts: [
      { say: "anne gidin ya, ben evde çalışırım", fx: { b: { anne: 4 } }, then: ["anne: Seni bırakıp gidemem. Sen de bilirsin."] },
      { say: "teşekkür ederim anne 🤍", fx: { b: { anne: 8 } }, then: ["anne: Ne teşekkürü. Sen yeter ki rahat ol."] },
    ],
  },
});
add({
  id: "my_kanka", m: 8, chat: "kanka", at: 0.45,
  lines: (s) => (kankaIyi(s) ? ["kanka: sınava giriyorum kesin. rezil olursam gülmeyin", "kanka: dayım sınav haftası izin verdi. 'git oku' dedi. dayım bile inanıyo bana"] : ["kanka: sınava giricem galiba. bilmiyorum. sen nasılsın"]),
  ask: {
    unread: -8, seen: -10,
    opts: [
      { say: "ben inanıyorum zaten", fx: { b: { kanka: 10 } }, then: ["kanka: biliyorum 🫡"] },
      { say: "aynı binadaysak beraber gidelim mi sınava?", fx: { b: { kanka: 8 } }, then: ["kanka: olur. sabah 8'de durakta"] },
    ],
  },
});
add({
  id: "my_ilgi", m: 8, chat: "ilgi", at: 0.6, if: (s) => ilgiStage(s) === 3,
  lines: ["ilgi: sınava 3 hafta var. 3 hafta görüşmeyelim mi diyorum", "ilgi: senin için değil, benim için. dağılıyorum"],
  ask: {
    unread: -8, seen: -10,
    opts: [
      { say: "tamam. ama her gece 'iyi geceler' yazıcam", fx: { b: { ilgi: 12 } }, then: ["ilgi: anlaştık 🌙"] },
      { say: "olmaz. sensiz asıl ben dağılırım", fx: { b: { ilgi: 6 }, st: -1 }, then: ["ilgi: 🙂 tamam. haftada bi çay"] },
    ],
  },
});
add({ id: "my_etut", m: 8, chat: "etut", at: 0.75, lines: ["etut: son deneme {etutNet}. ne olcaksa olcak artık"], ask: { unread: -3, seen: -4, opts: [{ say: "olcak. ikimiz için de", fx: { b: { etut: 5 } }, then: ["etut: 🤞"] }] } });
add({ id: "my_patron", m: 8, chat: "patron", at: 0.85, if: (s) => !!s.f.isOldu, lines: ["patron: Sınavdan sonraki pazartesi işbaşı mı? 😄 Şaka şaka. Bol şans {ad}."] });

/* ===== HAZİRAN: sınav sabahı ===== */
add({
  id: "h_aile", m: 9, chat: "aile", at: 0, saat: "06:41",
  lines: [
    "anne: Kalktın mı? Kimliğini koydun mu? Kalem, silgi?",
    "anne: Bir de su al yanına",
    "baba: Hadi bakalım {aslanim}. Sen yaparsın.",
    "teyze: #kart:sinav|Allah Yardımcın Olsun",
    "teyze: Sabah namazında dua ettim yavrum 🤲🌹",
    "kardes: {hitap} kolay gelsin 💪",
    "kardes: annem yazdırdı ama ben de diyorum",
    "anne: #foto:sinavsabahi",
    "anne: Kapıdan çıkarken çektim, kızma 🙈",
  ],
  ask: {
    who: "anne", unread: -1, seen: -1,
    opts: [
      { say: "kimlik tamam, kalem tamam, ben tamam 🫡", fx: { b: { anne: 5, baba: 5 } }, then: ["anne: ❤️", "baba: 👍"] },
      { say: "hepinizi çok seviyorum", fx: { b: { anne: 8, baba: 6, teyze: 5, kardes: 5 } }, then: ["anne: Biz de seni. Çok.", "kardes: ben biraz"] },
    ],
  },
});
add({
  id: "h_kanka", m: 9, chat: "kanka", at: 0.25, saat: "07:20", evenIfKus: true,
  lines: (s) => ("kanka" in s.kus ? ["kanka: küs müyüz bilmiyorum ama", "kanka: bol şans."] : ["kanka: bol şans kanka 🫡", "kanka: çıkışta kapıdayım"]),
  ask: {
    unread: -2, seen: -4,
    opts: (s) =>
      "kanka" in s.kus
        ? [{ say: "sana da. cidden. sonra konuşalım mı?", fx: { b: { kanka: 25 }, run: (st) => { delete st.kus.kanka; st.f.baristi = 1; } }, then: ["kanka: konuşalım 🤝"] }]
        : [{ say: "kapıda 🤝", fx: { b: { kanka: 5 } }, then: ["kanka: 🫡"] }],
  },
});
add({
  id: "h_ilgi", m: 9, chat: "ilgi", at: 0.4, saat: "07:34", if: (s) => ilgiStage(s) >= 1,
  lines: (s) => (ilgiStage(s) === 3 ? ["ilgi: dün gece iyi geceler yazdın mı bilmiyorum, uyumuşum 🙈", "ilgi: başarılar. çıkınca ara"] : ["ilgi: başarılar 🍀"]),
  ask: { unread: -2, seen: -3, opts: [{ say: "sana da 🍀", fx: { b: { ilgi: 4 } } }] },
});
add({ id: "h_etut", m: 9, chat: "etut", at: 0.55, saat: "07:02", lines: ["etut: kalemimi unuttum diye rüya gördüm. 3 kere kontrol ettim", "etut: başarılar"] });
add({ id: "h_sinif", m: 9, chat: "sinif", at: 0.7, saat: "07:15", lines: ["c0: BAŞARILAR 🦅🦅", "c1: Herkese başarılar arkadaşlar. Sınavdan sonra buluşalım mı?", "c2: bana bol bol dua edin", "c3: kimlik lazım mıydı"] });
add({ id: "h_rehber", m: 9, chat: "rehber", at: 0.85, saat: "07:05", if: (s) => s.bond.rehber >= 45, lines: ["rehber: Bugün sadece bugünü düşün. Başarılar {ad}."] });

/* ===== TEMMUZ: sonuç ve tercih ===== */
add({ id: "t_sinif", m: 10, chat: "sinif", at: 0, saat: "00:12", lines: ["c2: sonuçlar ne zaman açıklanıyodu", "c1: Açıklanınca haber gelir {c2}, sayfayı yenileyip durma 😄", "c0: BEKLEMEK SINAVDAN KÖTÜ"] });
add({
  id: "t_kanka", m: 10, chat: "kanka", at: 0.1, if: (s) => !("kanka" in s.kus),
  lines: ["kanka: nasıl geçti diye sormıycam", "kanka: sadece: deniz?"],
  ask: { unread: -4, seen: -6, opts: [{ say: "deniz.", fx: { b: { kanka: 8 } }, then: ["kanka: 20 dakikaya iskelede"] }] },
});
add({ id: "t_sonuc", m: 10, chat: "sonuc", at: 0.3, saat: "10:00", lines: ["sys: YKS sonucun açıklandı.", "sys: #sonuc:yks|Sayısal puan\n{puan}"] });
add({
  id: "t_aile", m: 10, chat: "aile", at: 0.45, hemen: true, saat: "10:09",
  lines: (s): string[] =>
    ({
      yuksek: ["anne: {ad}!!!!", "anne: Babana gösterdim, ağladı. Sonra 'gözüme bir şey kaçtı' dedi", "baba: Kaçtı.", "teyze: #kart:tebrik|Tebrikler", "kardes: odam gidiyo galiba 😔"],
      orta: ["anne: Puanı gördük. Seninle gurur duyuyoruz, bunu bil", "baba: Tercihleri beraber yaparız. Acele yok.", "kardes: {hitap} bu iyi mi? anlamadım ama tebrikler"],
      dusuk: ["anne: Ne olursa olsun sen bizim {oglum}sun.", "baba: Akşam konuşuruz. Kendini yeme.", "kardes: {hitap} kapını çalsam açar mısın"],
      yetersiz: ["anne: Kapındayım. Açmasan da buradayım.", "baba: Bir sene bir şey değil. Hiçbir şey değil."],
    } as Record<string, string[]>)[s.f.tier as string],
  ask: {
    who: "anne", unread: -3, seen: -5,
    opts: (s): Opt[] =>
      s.f.tier === "yuksek" || s.f.tier === "orta"
        ? [{ say: "teşekkürler 🥹", fx: { b: { anne: 5, baba: 5 } }, then: ["anne: ❤️"] }, { say: "daha iyisi olabilirdi", fx: { b: { baba: 3 } }, then: ["baba: Olabilirdi. Ama bu da senin. Hakkını ver."] }]
        : [{ say: "kapıyı açıyorum", fx: { b: { anne: 8, kardes: 6 } }, then: ["kardes: geldim", "anne: ❤️"] }, { say: "biraz yalnız kalmak istiyorum", fx: { b: { anne: 2 } }, then: ["anne: Tamam. Kapının önüne su bırakıyorum."] }],
  },
});
add({
  id: "t_kanka2", m: 10, chat: "kanka", at: 0.55, hemen: true, if: (s) => !("kanka" in s.kus),
  lines: (s): string[] =>
    ({
      iyi: ["kanka: kanka", "kanka: puanım geldi. 4 yıllık bi yer çıkar diyo dayım", "kanka: o notlar olmasa olmazdı bilmiş ol"],
      orta: ["kanka: benimki 2 yıllık bi yere yeter galiba", "kanka: düşük ama benim. dükkandan çıka çıka girdim"],
      kotu: ["kanka: ben olmadı", "kanka: seneye tekrar. ya da girmem. bilmiyorum"],
    } as Record<string, string[]>)[s.f.kankaSonuc as string],
  ask: {
    unread: -6, seen: -8,
    opts: (s) =>
      s.f.kankaSonuc === "kotu"
        ? [{ say: "seneye beraber çalışırız. ben neredeysem", fx: { b: { kanka: 10 } }, then: ["kanka: söz verme", "kanka: ...", "kanka: ver aslında. söz ver"] }]
        : [{ say: "seninle gurur duyuyorum kanka", fx: { b: { kanka: 8 } }, then: ["kanka: kes ağlıcam 😭"] }],
  },
});
add({
  id: "t_etut", m: 10, chat: "etut", at: 0.62, if: (s) => !("etut" in s.kus),
  lines: (s) => (s.f.etutSonuc === "dis" ? ["etut: tıp çıkmıyo", "etut: diş hekimliği çıkıyo. 'olsun' diyorum ama bilmiyorum. galiba olsun"] : ["etut: tıp çıkmıyo. seneye tekrar giricem", "etut: annem bu sefer 'para' demedi. 'sen bilirsin' dedi. bu daha kötü bi his"]),
  ask: { unread: -3, seen: -4, opts: [{ say: "kendine iyi davran. bi yıl bu", fx: { b: { etut: 6 } }, then: ["etut: sen de 🤍"] }] },
});
add({
  id: "t_ilgi", m: 10, chat: "ilgi", at: 0.7, if: (s) => ilgiStage(s) === 3,
  lines: ["ilgi: puanımı gördün mü? {sehir} çıkıyo bence", "ilgi: senin? ne yazcaksın?"],
});
add({
  id: "tercih", m: 10, chat: "aile", at: 0.85, saat: "21:30",
  lines: ["baba: Bu akşam tercih listesine oturuyoruz.", "baba: Önce sen söyle {oglum}. Ne istiyorsun?"],
  ask: {
    who: "baba", unread: -6, seen: -8,
    // Cevap verilmezse listeyi baban doldurur: İstanbul, puana göre.
    ignoreFx: {
      run: (s) => {
        const prog = s.f.tier === "yuksek" ? s.f.hedef : s.f.tier === "orta" ? s.f.altOrta : s.f.tier === "dusuk" ? s.f.altDusuk : "";
        s.f.tercih = prog ? { tip: "ist", prog, sehir: "İstanbul" } : { tip: "tekrar", prog: "", sehir: "İstanbul" };
        s.f.babaDoldurdu = 1;
      },
    },
    opts: (s) => {
      const h = s.f.hedef as string;
      const T = (tip: string, prog: string, sehir: string) => ({ tercih: { tip, prog, sehir } });
      const sev = ilgiStage(s) === 3;
      const o: Opt[] = [];
      if (s.f.tier === "yuksek") {
        o.push({ say: "İstanbul. {hedef}. evden gider gelirim", fx: { b: { anne: 8 }, set: T("ist", h, "İstanbul") } });
        o.push({ say: "{uzakDe} {hedef}. orası daha iyi bi okul", fx: { b: { baba: 6, anne: -3 }, set: T("uzak", h, s.f.uzak) } });
        if (sev) o.push({ say: "{sehirI} yazmak istiyorum. {hedef} orada da var", fx: { b: { ilgi: 12, anne: -4 }, set: T("ilgi", h, s.k.ilgiSehir) } });
      } else if (s.f.tier === "orta") {
        o.push({ say: "İstanbul'da {altOrta}. bölüm değil ama ev", fx: { b: { anne: 8 }, set: T("ist", s.f.altOrta, "İstanbul") } });
        o.push({ say: "Trabzon'da {hedef}. bölüm o bölüm", fx: { b: { baba: 5, anne: -3 }, set: T("uzak", h, "Trabzon") } });
        if (sev) o.push({ say: "{sehirDe} {altOrta}", fx: { b: { ilgi: 12, anne: -4 }, set: T("ilgi", s.f.altOrta, s.k.ilgiSehir) } });
        else o.push({ say: "hiçbir yer yazmıyorum. seneye tekrar", fx: { b: { baba: 2 }, set: T("tekrar", "", "İstanbul") } });
      } else if (s.f.tier === "dusuk") {
        o.push({ say: "İstanbul'da {altDusuk}. 2 yıllık ama burada", fx: { b: { anne: 6 }, set: T("ist", s.f.altDusuk, "İstanbul") } });
        o.push({ say: "Sivas'ta {altOrta}. 4 yıllık olsun", fx: { b: { baba: 4 }, set: T("uzak", s.f.altOrta, "Sivas") } });
        o.push({ say: "seneye tekrar gircem", fx: { b: { baba: 2 }, set: T("tekrar", "", "İstanbul") } });
      } else {
        o.push({ say: "seneye tekrar. bu sefer gerçekten", fx: { b: { baba: 4 }, set: T("tekrar", "", "İstanbul") } });
        o.push({ say: "bi sene çalışmak istiyorum. kafamı toplamak", fx: { b: { anne: -2, baba: 2 }, set: T("is", "", "İstanbul") } });
      }
      return o;
    },
  },
});
add({
  id: "tercih_tepki", m: 10, chat: "aile", at: 1, after: "tercih",
  lines: (s) => {
    const t = s.f.tercih.tip;
    if (t === "ist") return ["anne: Ben sana söylemiştim. Söylememiştim ama içimden söylemiştim 😄", "baba: 👍", "kardes: odam gitmedi 😔"];
    if (t === "uzak") return ["anne: ...", "anne: Tamam. Kışlık montunu alırız o zaman.", "baba: Uzağa gitmek de cesaret ister. Seninle gurur duyuyorum."];
    if (t === "ilgi") return ["anne: {sehir} mi? Neden {sehir}?", "kardes: anne sen bilmiyo musun 😏", "anne: Neyi bilmiyorum?", "baba: Kendi kararı. Saygı duyarız. Sonra anlatır 🙂"];
    if (t === "tekrar") return ["baba: Bir sene bir şey değil.", "anne: Kurs parasını hallederiz. Sen kafana takma."];
    return ["anne: Çalışmak mı? Okul ne olacak?", "baba: Bir sene dinlensin. Sonra bakarız. Biz buradayız."];
  },
});
add({
  id: "tercih_ilgi", m: 10, chat: "ilgi", at: 1, after: "tercih", if: (s) => ilgiStage(s) === 3,
  lines: (s) => {
    const t = s.f.tercih.tip;
    if (t === "ilgi") return ["ilgi: kardeşin yazdı bana", "ilgi: gerçekten mi 🥹", "ilgi: gerçekten mi gerçekten mi"];
    if (t === "ist") return ["ilgi: kardeşin söyledi. İstanbul", "ilgi: anlıyorum. gerçekten anlıyorum", "ilgi: sadece biraz üzüldüm. biraz"];
    if (t === "uzak") return ["ilgi: {tercihSehir} mi? 😄", "ilgi: üç şehir arası. haritaya bakıyorum şu an", "ilgi: otobüsle 'makul' diyo. makul ne demek"];
    return ["ilgi: seneye tekrar mı?", "ilgi: ben gitsem de burası benim için hep orada. bunu bil"];
  },
  fx: { run: (s) => (s.f.tercihSehir = s.f.tercih?.sehir ?? "") },
});

/* ===== AĞUSTOS: yerleştirme ===== */
add({
  id: "ag_sonuc", m: 11, chat: "sonuc", at: 0.05, saat: "10:00",
  lines: (s) => {
    const t = s.f.tercih?.tip;
    if (t === "tekrar" || t === "is") return ["sys: Yerleştirme sonuçları açıklandı.", "sys: Bu yıl tercih yapmadın."];
    if (!s.f.yerProg) return ["sys: Yerleştirme sonuçları açıklandı.", "sys: #sonuc:yer|Bu yıl bir programa yerleşemedin"];
    return ["sys: Yerleştirme sonuçları açıklandı.", `sys: #sonuc:yer|${s.f.yerProg}${IKI_YILLIK.has(s.f.yerProg) ? " (2 yıllık)" : ""}\n${s.f.yerSehir}`];
  },
});
add({
  id: "ag_aile", m: 11, chat: "aile", at: 0.25, hemen: true, saat: "10:20",
  lines: (s) => {
    const t = s.f.tercih?.tip;
    if (t === "tekrar" || t === "is" || !s.f.yerProg) return ["anne: Bir yıl daha bizimlesin. Ben buna da şükrederim.", "kardes: odam yine gitmedi", "baba: Eylülde kursa beraber gideriz kayda."];
    if (s.f.babaDoldurdu) return ["baba: Listeyi senin yerine ben doldurdum, sen kapını açmadın. İstanbul yazdım.", "anne: Gelmiş işte. Hayırlısı olsun.", "teyze: #kart:tebrik|Hayırlı Olsun"];
    if (s.f.yerSehir === "İstanbul") return [s.f.kaydi ? "anne: Listede aşağıdakiydi ama olsun. Senin olan gelmiş." : "anne: Allah'ım şükürler olsun 🤲", "teyze: #kart:tebrik|Hayırlı Olsun", "baba: Okul yolunu ben gösteririm ilk gün. Sonra sen bilirsin 🙂"];
    return ["anne: Bavulu bugün çıkardım. Açmadım daha. Sadece çıkardım.", "baba: Yurt başvurusunu beraber yaparız.", "teyze: #kart:tebrik|Hayırlı Olsun", "kardes: odana hemen geçmicem. bi hafta beklicem. saygıdan"];
  },
  ask: {
    who: "anne", unread: -1, seen: -1,
    opts: [{ say: "❤️", fx: { b: { anne: 3 } } }],
  },
});
add({
  id: "ag_ilgi", m: 11, chat: "ilgi", at: 0.45, if: (s) => ilgiStage(s) === 3,
  lines: (s) => (s.f.ayni ? ["ilgi: AYNI ŞEHİR", "ilgi: aynı şehir aynı şehir", "ilgi: #foto:deniz", "ilgi: bunu oraya da götürücem bak"] : ["ilgi: ben {sehir}. sen {yerSehir}", "ilgi: ...", "ilgi: biz ne olcaz?"]),
  ask: {
    unread: -6, seen: -10,
    opts: (s) =>
      s.f.ayni
        ? [{ say: "çay yine benden", fx: { b: { ilgi: 6 } }, then: ["ilgi: ömür boyu çay borcun var artık"] }]
        : [
            { say: "deneriz. her gece 'iyi geceler' anlaşması hâlâ geçerli", fx: { b: { ilgi: 8 }, set: { uzakIliski: 1 } }, then: ["ilgi: geçerli 🌙"] },
            { say: "bilmiyorum. gerçekten bilmiyorum", fx: { b: { ilgi: -4 }, set: { belirsiz: 1 } }, then: ["ilgi: ben de bilmiyorum", "ilgi: ama bu yılı iyi ki seninle geçirdim"] },
          ],
  },
});
add({
  id: "ag_kanka", m: 11, chat: "kanka", at: 0.6, if: (s) => !("kanka" in s.kus),
  lines: (s) => (s.f.yerSehir && s.f.yerSehir !== "İstanbul" ? ["kanka: gittiğin yerde bana da yer var mı 😄", "kanka: şaka. her ay geliyorum, haberin olsun", "kanka: otobüs paramı dükkandan çıkarırım"] : ["kanka: bi yere gitmiyosun di mi", "kanka: iyi. ben de bi yere gitmiyorum 🫡"]),
  ask: { unread: -3, seen: -4, opts: [{ say: "kapı hep açık kanka", fx: { b: { kanka: 4 } }, then: ["kanka: 🤝"] }] },
});
add({ id: "ag_etut", m: 11, chat: "etut", at: 0.7, if: (s) => !("etut" in s.kus), lines: (s) => (s.f.etutSonuc === "dis" ? ["etut: diş hekimliği. kesinleşti", "etut: annem artık 'o kadar para' demiyo 😄"] : ["etut: kursa tekrar yazıldım. aynı sınıf, aynı sıra", "etut: sen de gelirsen yanım boş 🙂"]) });
add({ id: "ag_patron", m: 11, chat: "patron", at: 0.8, if: (s) => !!s.f.isOldu, lines: ["patron: Eylülde gidiyorsan son bir cumartesi gel. Veda kahvesi benden.", "patron: Kalp yapmayı da o gün öğreteceğim, söz."] });
add({
  id: "ag_sinif", m: 11, chat: "sinif", at: 0.9, saat: "22:30",
  lines: ["c1: Arkadaşlar herkes nereye yerleşti, buraya yazalım 📍", "c0: TRABZON 🦅", "c2: açıktayım 🙂 seneye görüşürüz", "c4: Eskişehir. kimseyi tanımıyorum orada", "c3: biz hangi gün mezun olmuştuk"],
  ask: { unread: -1, seen: -1, opts: [{ say: "{yerKisa} 📍", fx: { b: { sinif: 3 } }, then: ["c1: 👏👏"] }] },
});

/* ---------- küsme satırları ---------- */
function kusLines(s: S, who: string): string[] {
  if (who === "kanka") return ["kanka: neyse. sen de haklısın belki. kolay gelsin"];
  if (who === "etut") return ["etut: ben bundan sonra ayrı çalışıcam, haberin olsun 👍"];
  if (who === "ilgi" && s.f.sevgili) {
    s.f.ayrildi = 1;
    return ["ilgi: bence biraz ara verelim", "ilgi: ben böyle yapamıyorum. kızgın değilim. sadece yoruldum"];
  }
  if (who === "patron") {
    s.f.is = 0;
    return ["patron: Bu hafta sonu gelmene gerek yok {ad}. Sınavına odaklan, kolay gelsin."];
  }
  return [];
}

/* ---------- ay sonu özeti ---------- */
const AY_HIS = [
  ["Okulun ilk haftası. Haziran çok uzakta gibi duruyor.", "Eylül. Defterler yeni, kalemler sivri."],
  ["Akşamlar kısaldı. Işık daha erken yanıyor artık.", "Ekim. Kurs çıkışı hava kararmış oluyor."],
  ["İlk deneme, ilk rakam. Rakam bir şey söylüyor, ne söylediği belli değil.", "Kasım. Masadaki deneme kitapları üst üste birikiyor."],
  ["Yılbaşı ışıkları yandı. Sen pek görmedin.", "Aralık. Herkesin bir planı var."],
  ["Karne. Yarıyıl. Yarısı gitti mi, yarısı mı kaldı?", "Ocak. Kalorifer tıkırdıyor, sen soru çözüyorsun."],
  ["Şubat kısa. Herkes yorgun.", "Şubat. Sabahlar hâlâ karanlık."],
  ["Mart. Denemede herkes düştü, kimse konuşmadı.", "Mart. Bayram geldi geçti, sen fark etmeden."],
  ["Nisan. Ağaçlar çiçek açtı, sen tercih kılavuzunu açtın.", "Nisan. Okulun bitmesine az kaldı."],
  ["Mayıs. Son ders zili. Herkes bir şey söylemek istedi, kimse söyleyemedi.", "Mayıs. Son deneme. Artık 'deneme' yok."],
];
const AD_GOSTER = (s: S, who: string) => ({ anne: "Annen", baba: "Baban", kardes: s.k.kardes.ad, teyze: `${s.k.teyze.ad} teyzen`, kanka: s.k.kanka.ad, ilgi: s.k.ilgi.ad, etut: s.k.etut.ad, patron: `${s.k.patron.ad} abi`, rehber: `${s.k.rehber.ad} Hoca` } as Record<string, string>)[who];

function summary(s: S, leftover: number): string[] {
  if (s.month === 9) {
    return ["Telefonu kapattın, kimliğin yanında.", "Bir sıra, bir kalem, bir silgi.", "Kâğıdı çevirdin.", "…", "Çıktığında hava hâlâ aydınlıktı. Bir yıl, birkaç saate sığmıştı."];
  }
  if (s.month >= 10) {
    return s.month === 10 ? ["Temmuz. Puan bir sayı. Ama evde herkes o sayıya bakıyor.", "Liste yapıldı, bozuldu, yeniden yapıldı."] : [];
  }
  const out: string[] = [];
  out.push(s.rng.pick(AY_HIS[s.month]));
  const masa = leftover === 0 ? s.rng.pick(["Bu ay masaya neredeyse hiç oturamadın.", "Kitaplar bu ay çantadan pek çıkmadı."]) : leftover === 1 ? s.rng.pick(["Bir akşam masa başı, gerisi başkalarına.", "Masaya bir akşam oturabildin."]) : leftover === 2 ? s.rng.pick(["İki akşam masa başında geçti.", "Akşamların yarısı derse gitti."]) : s.rng.pick(["Akşamların çoğu masa başında geçti.", "Bu ay masa lambası hep yanıktı.", "Telefon çoğu akşam ters duruyordu."]);
  out.push(masa);
  const ign = [...new Set(s.monthLog.ignoredWho.filter((w) => w !== "sinif"))].slice(0, 2).map((w) => AD_GOSTER(s, w)).filter(Boolean);
  if (ign.length === 1) out.push(`${ign[0]} yazdı. Cevapsız kaldı.`);
  if (ign.length === 2) out.push(`${ign[0]} ve ${ign[1]} yazdı. İkisi de cevapsız kaldı.`);
  return out;
}

/* ---------- sohbet adları ---------- */
export function chatName(s: S, c: ChatId): string {
  const k = s.k;
  switch (c) {
    case "aile": return "Ailemiz 🏡";
    case "anne": return "Annem";
    case "baba": return "Babam";
    case "kardes": return k.kardes.ad;
    case "sinif": return "12-C 🦅 SON SENE";
    case "kanka": return k.kanka.ad;
    case "ilgi": {
      const st = ilgiStage(s);
      return st === 3 ? `${k.ilgi.ad} ${k.ilgiEmoji}` : st >= 1 ? k.ilgi.ad : `${k.ilgi.ad} (kurs)`;
    }
    case "etut": return `${k.etut.ad} · Etüt`;
    case "patron": return `${k.patron.ad} Abi · Kafe`;
    case "rehber": return `${k.rehber.ad} Hoca`;
    case "kurs": return "Kurs Bilgilendirme";
    case "sonuc": return "Sınav Sonuç";
  }
}
export function senderName(s: S, from: string): string {
  const k = s.k;
  if (from.startsWith("c")) return k.sinif[Number(from.slice(1))]?.ad ?? from;
  const map: Record<string, string> = { anne: "Annem", baba: "Babam", kardes: k.kardes.ad, teyze: `${k.teyze.ad} Teyze`, kanka: k.kanka.ad, ilgi: k.ilgi.ad, etut: k.etut.ad, patron: k.patron.ad, rehber: k.rehber.ad };
  return map[from] ?? from;
}
export const GROUPS: ChatId[] = ["aile", "sinif"];
export { ilgiStage };

/* ---------- yıl sonu: o yıldan kalanlar ---------- */
export interface Kalan { chat: string; ad: string; satir: string; canli: boolean }
export function kalanlar(s: S): Kalan[] {
  const k = s.k;
  const out: Kalan[] = [];
  const lastMonth = (c: ChatId, who: string) => {
    const m = [...s.msgs].reverse().find((x) => x.chat === c && x.from === who);
    return m ? m : null;
  };
  const AY = ["Eylül", "Ekim", "Kasım", "Aralık", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos"];
  out.push({ chat: "anne", ad: "Annem", canli: true, satir: s.bond.anne >= 60 ? "Her sabah hâlâ 'günaydın' yazıyor. Sen de artık cevap veriyorsun." : "Mesajları kısaldı. Ama her sabah yine yazıyor." });
  out.push({ chat: "baba", ad: "Babam", canli: true, satir: s.f.cevap_o_baba ? "Hâlâ her mesaja 👍 atıyor. Künefe sözünü tuttu." : "Hâlâ her mesaja 👍 atıyor. Bir de sınav sabahı 'sen yaparsın' yazmıştı." });
  // kanka
  if ("kanka" in s.kus) {
    const l = lastMonth("kanka", "kanka");
    out.push({ chat: "kanka", ad: k.kanka.ad, canli: false, satir: `Son mesaj ${AY[l?.month ?? 0]}: "${(l?.text ?? "").replace(/[.]$/, "")}". Sonra hiçbir şey.` });
  } else if (s.bond.kanka >= 70) out.push({ chat: "kanka", ad: k.kanka.ad, canli: true, satir: s.f.baristi ? "Sınav sabahı barıştınız. O günden beri her gün." : "Bu yılın en uzun sohbeti. Hâlâ her gün." });
  else out.push({ chat: "kanka", ad: k.kanka.ad, canli: true, satir: "Arada bir. Doğum gününde mutlaka." });
  // ilgi
  const st = ilgiStage(s);
  if (s.f.ayrildi) out.push({ chat: "ilgi", ad: k.ilgi.ad, canli: false, satir: `"Biraz ara verelim" demişti, ${AY[s.kus.ilgi ?? 0]} ayında. Ara hâlâ sürüyor.` });
  else if (st === 3) out.push({ chat: "ilgi", ad: `${k.ilgi.ad} ${k.ilgiEmoji}`, canli: true, satir: s.f.ayni ? "Aynı şehir. Çay borcu ömür boyu." : s.f.uzakIliski ? "Ayrı şehirler. Her gece 'iyi geceler'. Şimdilik." : "Ne olacağı belli değil. Ama bu yıl ikinizindi." });
  else if (st >= 1) out.push({ chat: "ilgi", ad: k.ilgi.ad, canli: false, satir: "Bir şeyler olabilirdi. Olmadı. Arada bir hikâyesini görüyorsun." });
  else if (s.f.ilgiTanisti) out.push({ chat: "ilgi", ad: `${k.ilgi.ad} (kurs)`, canli: false, satir: "Eylül'de bir fizik notu istemişti. O kadar." });
  // etüt
  out.push("etut" in s.kus ? { chat: "etut", ad: k.etut.ad, canli: false, satir: "Ayrı çalışmaya karar vermişti. Sonucunu başkasından duydun." } : { chat: "etut", ad: k.etut.ad, canli: true, satir: s.f.etutYurudu ? "O mart gecesi yürüdünüz. Bunu ikiniz de unutmayacaksınız." : "Deneme netleri, kütüphane, lahmacun. Bir yıllık yol arkadaşı." });
  // kardeş
  if ("kardes" in s.kus) out.push({ chat: "kardes", ad: k.kardes.ad, canli: false, satir: "Sana yazmayı bıraktı. Kapını da artık çalmıyor." });
  else if (s.f.cevap_m_kardes) out.push({ chat: "kardes", ad: k.kardes.ad, canli: true, satir: "Kesirler bitti. Ama hâlâ 'ödev' bahanesiyle odana geliyor." });
  out.push({ chat: "teyze", ad: `${k.teyze.ad} Teyze`, canli: true, satir: "Her cuma bir gül kartı. Bir yıl boyunca bir kez bile aksatmadı." });
  // sınıf
  out.push({ chat: "sinif", ad: "12-C 🦅", canli: s.bond.sinif >= 55, satir: s.bond.sinif >= 55 ? "Grup hâlâ yaşıyor. Biri her ay 'buluşalım mı' yazıyor." : "Grubu sessize aldın. Okunmamış mesajlar birikiyor." });
  if (s.f.isOldu) out.push({ chat: "patron", ad: `${k.patron.ad} Abi`, canli: !("patron" in s.kus), satir: "patron" in s.kus ? "Kafenin önünden geçerken başını çeviriyorsun." : "Kalp yapmayı sonunda öğrendin. Biraz yamuk." });
  return out;
}

/** Sonucun nedeni, tek cümle. */
export function neden(s: S): string {
  const t = s.f.tercih?.tip;
  const p = s.f.puan;
  if (s.f.babaDoldurdu) return `Puanın ${p}. Tercih akşamı sen yoktun; listeyi baban doldurdu.`;
  if (t === "tekrar" && s.f.tier === "yetersiz") return `Puanın ${p}. Bu yıl istediğin yere yetmedi; seneye tekrar gireceksin.`;
  if (t === "tekrar") return `Puanın ${p}. Bir yere yerleşebilirdin; seneye tekrar girmeyi sen seçtin.`;
  if (t === "is") return `Puanın ${p}. Bir yıl çalışmayı, kafanı toplamayı seçtin.`;
  if (!s.f.yerProg) return `Puanın ${p}. Yazdığın yerlerin hiçbiri tutmadı. Şans da bu yıl yanında değildi.`;
  if (s.f.kaydi) return `Puanın ${p}. İlk tercihin tutmadı, listede aşağıdaki geldi.`;
  if (t === "ilgi") return `Puanın ${p}. ${s.k.ilgi.ad} yüzünden mi, bölüm yüzünden mi, ikisini de söylemedin.`;
  if (t === "uzak") return `Puanın ${p}. Evden uzağı seçtin.`;
  return `Puanın ${p}. Evde kalmayı seçtin.`;
}

export function yerKisa(s: S): string {
  if (!s.f.yerProg) return s.f.tercih?.tip === "is" ? "kafede, bir yıl" : "seneye tekrar";
  return `${s.f.yerSehir}, ${s.f.yerProg}`;
}

// yerKisa sınıf grubunda değişken olarak lazım
const _ag = B.find((b) => b.id === "ag_sinif")!;
_ag.fx = { run: (s) => (s.f.yerKisa = yerKisa(s)) };

icerikYukle(B, MONTH_START, kusLines, summary);

/** İçerik denetimi: tekil kimlik, var olan soruya bağlı tepkiler, bilinen medya. */
export function tumBeatlerKontrol(): string[] {
  const err: string[] = [];
  const ids = new Set<string>();
  for (const b of B) {
    if (ids.has(b.id)) err.push("tekrar kimlik " + b.id);
    ids.add(b.id);
  }
  for (const b of B) if (b.after && !B.some((o) => o.id === b.after && o.ask)) err.push("tepki sahipsiz " + b.id);
  return err;
}
export const BEATS = B;
