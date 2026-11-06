# K1-FW — Çok Lokasyonlu Kurumsal Ağ ve Güvenlik Duvarı

> Contributed by `H*** A*** K***` ([@frudotz](https://github.com/frudotz)) · BGT207 Güvenlik Duvarı Çözümleri · 2026-2027 Güz midterm project.
> Student names are masked on purpose. Converted from the student's research-phase repository (Turkish); the seven most relevant documents are kept in full below.

# Genel bakış


> **Durum (2026-10-23):** Araştırma ve dokümantasyon fazı **tamamlandı**. Simülasyon **henüz kurulmadı**, hiçbir güvenlik duvarı yapılandırılmadı, hiçbir test çalıştırılmadı.
> **Ders:** Güvenlik Duvarı Çözümleri (Firewall Solutions) — üniversite ödevi.
> **Dil:** Türkçe. Sektörde standart olan İngilizce teknik terimler (firewall, VLAN, zone, limiter vb.) korunmuş ve ilk geçişte açıklanmıştır.

Bu depo, kurgusal çok uluslu bir organizasyon için güvenlik duvarı merkezli kurumsal ağ tasarımının araştırma, gereksinim, envanter, mimari, politika, test planı ve karar belgelerini içerir. Belgeler, sonraki fazda kurulacak simülasyon laboratuvarına temel oluşturmak için yazılmıştır.

## 1. Senaryo

**Fiziksel lokasyonlar:** Ankara Ofisi, İstanbul Ofisi, Londra Ofisi, Akademik Yerleşke (Academic Branch).

**Organizasyon birimleri:**
- Akademik birim: 10.000 öğrenci; akademik personel ve öğretim elemanları; idari personel; teknik personel; olası laboratuvarlar, bilgisayar sınıfları, kampüs Wi-Fi ve akademik bilgi sistemleri.
- Yazılım Mühendisliği Ekibi
- BT ve Ağ Operasyonları Ekibi
- Araştırma ve Geliştirme (Ar-Ge) Ekibi

Yazılım, BT operasyon ve Ar-Ge ekiplerinin **fiziksel konumu ödevde belirlenmemiştir**; mevcut bir ofis içinde veya ayrı mantıksal ağ bölgeleri (zone) olarak çalışabilirler. Ofis başına personel sayısı, cihaz sayısı, internet kapasitesi ve eşzamanlı aktif kullanıcı sayısı **bilinmemektedir**. Bu belgeler hiçbir yerde bu değerleri olgu gibi sunmaz; her sayısal değer etiketlenir:

| Etiket | Anlamı |
|---|---|
| **(F)** | Ödev metninde verilen olgu |
| **(V)** | Simülasyon için eklenen varsayım (kimlik: V-xx) |
| **(Ö)** | Örnekleyici sayı; ölçülmüş gereksinim değil |
| **(A)** | Araştırma/ölçüm gerekli (A-xx) |
| **(Q)** | Öğretim görevlisi kararı gerekli (Q-xx) |
| **(K)** | Vendor/standart kaynağına dayanır (S-xx) |

Etiket şeması ve tüm kayıtlar: [`requirements/assumptions-and-open-questions.md`](requirements/assumptions-and-open-questions.md).

## 2. Ödevin amacı ve kapsamı

Bu faz, uygulama öncesi **araştırma ve dokümantasyon** ile sınırlıdır:

| Hedef | İçerik | Ana belge |
|---|---|---|
| A | Gereksinim ve organizasyon envanteri | `requirements/`, `inventory/` |
| B | Bant genişliği planlama ve trafik yönetimi | **[`research/tahmini-bant-genisligi.md`](research/tahmini-bant-genisligi.md)** (teslim), [`research/bandwidth-planning.md`](research/bandwidth-planning.md), [`policies/bandwidth-policy.md`](policies/bandwidth-policy.md) |
| C | Kurumsal güvenlik duvarı mimarisi ve güvenlik bölgeleri | [`research/security-architecture.md`](research/security-architecture.md), [`architecture/vlan-and-security-zones.md`](architecture/vlan-and-security-zones.md), [`policies/firewall-policy-matrix.md`](policies/firewall-policy-matrix.md) |
| D | Teknoloji ve simülasyon ortamı değerlendirmesi | **[`research/onerilen-guvenlik-duvarlari.md`](research/onerilen-guvenlik-duvarlari.md)** (teslim), [`research/firewall-technology-comparison.md`](research/firewall-technology-comparison.md), [`research/simulation-platform-comparison.md`](research/simulation-platform-comparison.md), [`decisions/technology-recommendation.md`](decisions/technology-recommendation.md) |
| E | Adresleme ve topoloji | [`architecture/conceptual-topology.md`](architecture/conceptual-topology.md), [`architecture/proposed-ip-plan.md`](architecture/proposed-ip-plan.md), [`architecture/inter-site-connectivity.md`](architecture/inter-site-connectivity.md) |
| F | Test ve doğrulama stratejisi | [`validation/test-plan.md`](validation/test-plan.md) |

**Kapsam dışı (bu fazda yapılmadı):** yazılım kurulumu, sanal cihaz imajı indirme, lisans alma, bulut kaynağı açma, güvenlik duvarı yapılandırma, test çalıştırma.

## 3. Belge dizini

### research/ — araştırma ve kaynaklar
| Belge | İçerik |
|---|---|
| [research-overview.md](research/research-overview.md) | Yöntem, fazlar, bulgu özeti, tutarlılık denetimi |
| [sources-and-references.md](research/sources-and-references.md) | Tüm kaynaklar: URL, revizyon tarihi, erişim tarihi, güvenilirlik etiketi, doğrulanamayan maddeler |
| [firewall-technology-comparison.md](research/firewall-technology-comparison.md) | pfSense CE, OPNsense, FortiGate-VM, Palo Alto VM-Series, Cisco ASA (Packet Tracer), Linux nftables karşılaştırması |
| [simulation-platform-comparison.md](research/simulation-platform-comparison.md) | Packet Tracer, GNS3, EVE-NG, VirtualBox/VMware, Proxmox/ESXi karşılaştırması; lab kaynak hesabı |
| [bandwidth-planning.md](research/bandwidth-planning.md) | Dört "hız" kavramı, eşzamanlılık, üç akademik talep senaryosu, QoS mekanizmaları (kavramsal arka plan) |
| **[tahmini-bant-genisligi.md](research/tahmini-bant-genisligi.md)** | **Teslim belgesi:** hesaplama modeli ve formüller, akademik şube için üç senaryo (indirme/yükleme, devre, kullanım oranı, risk), lokasyon ve ekip hesapları, doldurulabilir tablo, kapasite–hız politikası ayrımı, simülasyon başlangıç değerleri, yükseltme kriterleri |
| [security-architecture.md](research/security-architecture.md) | Yetenek değerlendirmesi (zorunlu/opsiyonel/pratik değil), mimari ilkeler, site sınırları, tehdit modeli |
| **[onerilen-guvenlik-duvarlari.md](research/onerilen-guvenlik-duvarlari.md)** | **Teslim belgesi:** gereksinim sınıflandırması (zorunlu/önerilen/isteğe bağlı), ürün karşılaştırması (pfSense CE, OPNsense, FortiGate-VM, VM-Series, ASA/Packet Tracer), GNS3 + pfSense önerisinin yeniden değerlendirilmesi, nihai karar tablosu |

### requirements/ — gereksinimler
| Belge | İçerik |
|---|---|
| [functional-requirements.md](requirements/functional-requirements.md) | FR-01..34, test planına eşlenmiş |
| [nonfunctional-requirements.md](requirements/nonfunctional-requirements.md) | NFR-01..23: güvenlik, erişilebilirlik, performans, ölçeklenebilirlik, yönetilebilirlik |
| [assumptions-and-open-questions.md](requirements/assumptions-and-open-questions.md) | Etiket şeması; F-01..08, V-01..15, A-01..12, Q-01..13 |

### inventory/ — lokasyon ve birim envanterleri (şablon + etiketli varsayımlar)
| Belge | Kapsam |
|---|---|
| [ankara-office/inventory.md](inventory/ankara-office/inventory.md) | Merkez (HQ), VPN hub, merkezi sunucular (V) |
| [istanbul-office/inventory.md](inventory/istanbul-office/inventory.md) | Ofis + Yazılım Mühendisliği (V) |
| [london-office/inventory.md](inventory/london-office/inventory.md) | Küçük yurt dışı ofis, yasal sınır notu (V) |
| [academic-branch/inventory.md](inventory/academic-branch/inventory.md) | 10.000 öğrenci (F), personel, lab, Wi-Fi, akademik sistemler |
| [software-team/inventory.md](inventory/software-team/inventory.md) | Geliştirici, CI/CD, artefakt akışları |
| [it-operations/inventory.md](inventory/it-operations/inventory.md) | Roller, yönetim araçları, değişiklik/yedek süreçleri |
| [rnd-team/inventory.md](inventory/rnd-team/inventory.md) | Ar-Ge veri akışları, fikri mülkiyet gereksinimleri |

### architecture/ — mimari (ÖNERİ niteliğinde)
| Belge | İçerik |
|---|---|
| [conceptual-topology.md](architecture/conceptual-topology.md) | Mermaid diyagramları: organizasyon, akademik yerleşke, ofis şablonu, hedef GNS3 lab topolojisi |
| [proposed-ip-plan.md](architecture/proposed-ip-plan.md) | IPv4 planı (tek kaynak), VLAN şeması, transit/VPN adresleri, lab WAN adresleri, IPv6 ULA notu, DHCP/DNS yerleşimi |
| [vlan-and-security-zones.md](architecture/vlan-and-security-zones.md) | Zone listesi, iletişim matrisi, izolasyon gerekçeleri, site sınırları |
| [inter-site-connectivity.md](architecture/inter-site-connectivity.md) | IPsec IKEv2 VTI hub-and-spoke tasarımı, tünel parametreleri, yönlendirme, remote-access VPN |

### policies/ — politikalar
| Belge | İçerik |
|---|---|
| [bandwidth-policy.md](policies/bandwidth-policy.md) | Örnekleyici trafik sınıfı matrisi (BW-01..08), zamanlama, lab ölçek değerleri |
| [firewall-policy-matrix.md](policies/firewall-policy-matrix.md) | Alias tabanlı zone-to-zone kural satırları (P-01..P-99), NAT politikası |

### validation/ ve decisions/
| Belge | İçerik |
|---|---|
| [validation/test-plan.md](validation/test-plan.md) | 21 test senaryosu (amaç, ön koşul, prosedür, beklenen sonuç, kanıt); **hiçbiri çalıştırılmadı** |
| [decisions/decision-log.md](decisions/decision-log.md) | ADR-001..010 ve sonraki fazın önceliklendirilmiş planı |
| [decisions/technology-recommendation.md](decisions/technology-recommendation.md) | Birincil / alternatif / ileri seviye ortam önerisi ve gerekçeleri |
| [diagrams/README.md](diagrams/README.md) | Dışa aktarılan diyagramlar için yer tutucu (henüz dışa aktarım yok) |

### Dizin yapısı
```
k1-fw/
├── README.md
├── research/          (8 belge; ikisi ders teslim çıktısı)
├── requirements/      (3 belge)
├── inventory/         (7 belge: ankara-office, istanbul-office, london-office,
│                        academic-branch, software-team, it-operations, rnd-team)
├── architecture/      (4 belge)
├── policies/          (2 belge)
├── validation/        (1 belge)
├── decisions/         (2 belge)
└── diagrams/          (README.md; SVG/PNG dışa aktarımları ileride)
```
Uygulama fazı için önerilen ek dizinler (`implementation/`, `test-results/`, `changelog/`) boş belge üretmemek için henüz oluşturulmamıştır (bkz. ADR-001).

## 4. Araştırma bulgularının özeti

- **Güvenlik duvarı ürünleri:** pfSense CE (2.9.0) ve OPNsense (26.7) ücretsiz, açık kaynak ve ödevin tüm zorunlu yeteneklerini (stateful firewall, NAT, VLAN, IPsec IKEv2, kullanıcı/IP başına limiter, CARP HA) resmi belgelerle karşılıyor. FortiGate-VM kalıcı deneme lisansı çok kısıtlı (3 arayüz / 3 policy olarak raporlanıyor; **doğrulanmamış**), Palo Alto VM-Series 30 günlük ve yüksek RAM istiyor; Packet Tracer içindeki ASA 5506-X per-IP limitleme ve gerçek loglama sunmuyor.
- **Platformlar:** Packet Tracer bir simülatördür ve üçüncü taraf imaj çalıştıramaz; GNS3 ve EVE-NG gerçek imaj çalıştıran emülasyon platformlarıdır. GNS3 ücretsizdir ve 16 GB RAM önerir. EVE-NG'nin ücretsiz katmanının node sınırı resmi sayfada çelişkili belgelenmiştir.
- **Mimari:** Her sitede varsayılan reddet (default-deny) firewall ve yerel internet çıkışı; 10 mantıksal güvenlik bölgesi; yönetim ağı (MGMT) ile BT operasyon iş istasyonlarının (IT-OPS) ayrılması; Ankara merkezli hub-and-spoke IPsec IKEv2 VTI; tek 10.0.0.0/8 bloğu içinde site = 2. oktet, VLAN = 3. oktet şeması; akademik yerleşke için /14.
- **Bant genişliği:** Kapasite, "10.000 × kullanıcı başına limit" ile hesaplanmaz. Eşzamanlılık oranı × aktif kullanıcı başına talep × tepe katsayısı modeliyle üç akademik senaryo üretildi; senaryolar arasında yaklaşık 5 kat fark vardır. Adalet için per-IP limiter, öncelik için sınıf ağırlığı/ALTQ önerildi. Tüm Mbps değerleri örnekleyicidir.

## 5. Geçici simülasyon ortamı önerisi

| | Birincil | Alternatif | İleri seviye (opsiyonel) |
|---|---|---|---|
| Platform | GNS3 + GNS3 VM | VirtualBox / VMware Workstation (doğrudan) | EVE-NG / Proxmox |
| Firewall | pfSense CE 2.9 | pfSense CE veya OPNsense 26.7 | + FortiGate-VM deneme / VM-Series deneme |
| Neden | Gerçek imaj, 802.1Q anahtar, görsel topoloji, Wireshark; pfSense 1 GB RAM ile çalışır | En az katman; GNS3 kurulum sorunlarında veya 8 GB makinede | Ticari NGFW karşılaştırması beklenirse |
| Ana risk | GNS3 VM ↔ hipervizör uyumu | VLAN access/trunk gösterimi zayıf | Lisans/node sınırı belirsiz |

Gerekçeler, kanıtlar ve kısıtlar: [`decisions/technology-recommendation.md`](decisions/technology-recommendation.md). Öneri **öğretim görevlisi onayı beklemektedir** (Q-01, Q-04, Q-05).

## 6. Önemli varsayımlar ve açık sorular

**Başlıca varsayımlar (V):** Ankara = merkez ve VPN hub (V-01); BT operasyon Ankara'da, yazılım ekibi İstanbul'da, Ar-Ge akademik yerleşkede (V-02..04); personel sayıları yalnızca örnekleyici (V-06); lab ölçeği küçültülmüş (V-13).

**Öncelikli açık sorular (Q):**
1. Q-01 — Emülasyon ortamı (GNS3 + pfSense) kabul ediliyor mu, yoksa Packet Tracer zorunlu mu?
2. Q-02 — Ekiplerin fiziksel konumu için önerilen varsayımlar kabul edilir mi?
3. Q-03 — Personel/cihaz/kapasite sayıları varsayılabilir mi, yoksa verilecek mi?
4. Q-04 — Dört sitenin tamamı mı, küçültülmüş topoloji mi?

Tam liste (13 soru, 12 araştırma kalemi): [`requirements/assumptions-and-open-questions.md`](requirements/assumptions-and-open-questions.md).

**Doğrulanamayan kaynaklar:** FortiGate-VM deneme limitleri, EVE-NG sistem gereksinimleri ve node sınırı, Packet Tracer güncel sürüm/lisans bilgisi web araçlarıyla birincil sayfadan alınamadı ve "doğrulanmamış" olarak işaretlendi. Liste: [`research/sources-and-references.md`](research/sources-and-references.md) §5. Bu depoya aktarım sırasında kaynaklar **yeniden doğrulanmamıştır**; aktarım, mevcut belgeleri olduğu gibi yayınlar.

## 7. Mevcut durum

| Tamamlanma kriteri (ödev §8) | Durum |
|---|---|
| Senaryo ve gereksinimler belgelendi | ✅ |
| Her lokasyon ve birim için envanter şablonu | ✅ (7 belge) |
| Bilinmeyenler ve varsayımlar ayrıştırıldı | ✅ |
| Savunulabilir örnekleyici bant genişliği senaryoları | ✅ (3 senaryo; teslim belgesi `research/tahmini-bant-genisligi.md`) |
| Ders tarafından istenen "Tahmini Bant Genişliği" ve "Önerilen Güvenlik Duvarları" belgeleri | ✅ `research/tahmini-bant-genisligi.md`, `research/onerilen-guvenlik-duvarlari.md` |
| Güvenlik bölgeleri ve politika ilkeleri | ✅ |
| Teknoloji ve simülasyon ortamı karşılaştırması (kaynaklı) | ✅ |
| Tercih edilen ortam + alternatif, gerekçeli | ✅ (onay bekliyor) |
| Ön topoloji ve adresleme stratejisi | ✅ |
| Test planı | ✅ (hiçbir test çalıştırılmadı) |
| İzlenebilir referanslar | ✅ (doğrulanamayanlar işaretli) |
| Sonraki adımların önceliklendirilmesi | ✅ |
| **Simülasyon kurulumu, yapılandırma, test** | ❌ **Başlamadı** |

## 8. Sonraki faz

1. Öğretim görevlisinden Q-01..Q-04 cevapları; doğrulanamayan kaynakların tarayıcıyla teyidi.
2. Ekip bilgisayarlarının RAM / sanallaştırma desteği envanteri (A-08); gerekirse küçültülmüş topoloji (ADR-005).
3. GNS3 + pfSense CE kurulumu; önce Ankara + Akademik + ISP-SIM ile başlangıç; her değişiklikte XML yedek ve Git kaydı.
4. Test planının çalıştırılması ve sonuçların kanıtlarla `test-results/` altına kaydedilmesi.
5. Opsiyonel: CARP HA, Suricata, ticari NGFW demosu; diyagram dışa aktarımları; final rapor.

Ayrıntılı öncelik listesi: [`decisions/decision-log.md`](decisions/decision-log.md) — "Sonraki faz".

---

> Bu depo araştırma ve dokümantasyon aşamasındadır. Ağ uygulanmış, güvenlik duvarı kurulmuş veya testler çalıştırılmış değildir.


---

# Önerilen güvenlik duvarları


**Belgenin amacı:** Mevcut ürün ve platform araştırmasını ([`firewall-technology-comparison.md`](firewall-technology-comparison.md), [`simulation-platform-comparison.md`](simulation-platform-comparison.md)) ders teslimine uygun, gerekçeli bir **güvenlik duvarı önerisi ve karar tablosu** hâline getirmek; GNS3 + pfSense CE önerisini yeniden değerlendirmek.
**İlişkili belgeler:** Gereksinim kimlikleri (FR/NFR) → `../requirements/`; karar kayıtları → [`../decisions/decision-log.md`](../decisions/decision-log.md); kaynak kimlikleri (S-xx) → [`sources-and-references.md`](sources-and-references.md).
**Tarih:** 2026-10-23 (kaynaklara erişim tarihi aynı)

> **Kategori uyarısı:** GNS3 ve EVE-NG **ağ emülasyon platformlarıdır** (gerçek cihaz imajlarını sanal topolojide çalıştırır); pfSense, OPNsense, FortiGate-VM ve VM-Series **güvenlik duvarı / yönlendirici yazılımlarıdır**; Packet Tracer ise gerçek yazılım çalıştırmayan bir **simülatördür**. Bu belge güvenlik duvarı ürünlerini birbirleriyle, platformu ise ayrı bir satırda karşılaştırır; ikisi aynı türden ürünler değildir.

## 1. Proje gereksinimleri ve sınıflandırma

Sınıf: **Z** zorunlu · **Ö** önerilen · **İ** isteğe bağlı. Gerekçe, ödev metninin istediği gösterimlere ve lab'ın pratik sınırlarına dayanır.

| # | Gereksinim | Sınıf | Neden | İlgili FR/NFR |
|---|---|---|---|---|
| G-01 | Çok lokasyonlu ağ (4 site, aynı anda ≥ 3–4 firewall instance'ı) | Z | Ödevin senaryosu; siteler arası politika ve VPN gösterilemezse tasarım kavramsal kalır | FR-15, ADR-005 |
| G-02 | 802.1Q VLAN ve ≥ 10 güvenlik bölgesi | Z | Akademik zone modeli ödevin çekirdeği | FR-01, NFR-16 |
| G-03 | Stateful firewall, varsayılan reddet | Z | Tüm politika matrisi buna dayanır | FR-02, FR-09 |
| G-04 | NAT ve statik yönlendirme (NAT istisnası dahil) | Z | İnternet çıkışı ve VPN üzerinden NAT'sız iç trafik | FR-11, FR-12 |
| G-05 | Site-to-site IPsec IKEv2 (route-based) | Z | Siteler arası tasarımın taşıyıcısı | FR-15, FR-16 |
| G-06 | Remote-access VPN (rol bazlı) | Ö | Ödev listesinde var; tek kullanıcı demosu yeter | FR-18, FR-19 |
| G-07 | Bant genişliği yönetimi: **per-IP limit** + sınıf önceliği | Z | Ödevin B bölümü; ölçülebilir olmalı | FR-20..22 |
| G-08 | Kural bazlı loglama, uzak syslog, canlı görünüm | Z | Testlerin kanıtı loglardır | FR-09, FR-31 |
| G-09 | Yönetim erişiminin MGMT ile sınırlandırılması | Z | Management-plane protection | FR-29, NFR-02 |
| G-10 | Yapılandırma yedekleme ve geri yükleme (dosya tabanlı, sürümlenebilir) | Z | Değişiklik yönetimi süreci | FR-32, NFR-09 |
| G-11 | Yüksek erişilebilirlik (aktif/pasif) | İ | Ek VM maliyeti; tek sitede demo yeterli | FR-33, NFR-07 |
| G-12 | IDS/IPS, DNS/web filtreleme | İ | CPU maliyeti; kavram gösterimi | FR-34 |
| G-13 | Ücretsiz / süresiz lisans, öğrenci erişimi | Z | Ödev süresi boyunca kesintisiz çalışma; bütçe yok | — |
| G-14 | Düşük kaynak tüketimi (instance başına ≤ ~1–3 GB RAM; toplam ≤ ~12 GB) | Z | Öğrenci dizüstü bilgisayarı | ADR-005 |
| G-15 | Sanal ortamda (QEMU/KVM, VirtualBox, VMware) resmî destek | Z | Lab tamamen sanal | — |
| G-16 | Resmî, güncel, tarihli dokümantasyon | Ö | Savunulabilirlik ve öğrenme | — |
| G-17 | Merkezi çoklu-firewall yönetimi | İ | Ticari ürünlerde lisanslı; lab'da config + Git ile ikame | — |

## 2. Ürün karşılaştırması

Ayrıntılı ürün değerlendirmeleri `firewall-technology-comparison.md` §3'tedir; burada ders teslimi için kriter bazlı özet verilir. ✅ karşılar · ◑ kısmen/koşullu · ❌ karşılamaz · ❔ doğrulanamadı.

| Kriter | **pfSense CE 2.9** | **OPNsense 26.7** | **FortiGate-VM (kalıcı deneme)** | **Palo Alto VM-Series (30 gün deneme)** | **Cisco ASA 5506-X (Packet Tracer modeli)** |
|---|---|---|---|---|---|
| Ürün türü | Açık kaynak firewall/router (FreeBSD) | Açık kaynak firewall/router (FreeBSD) | Ticari NGFW'nin VM sürümü | Ticari NGFW'nin VM sürümü | Simülatör içi model (gerçek yazılım değil) |
| Eğitim ortamına uygunluk | ✅ | ✅ | ◑ tek site mini demo | ◑ kavram demosu | ◑ yalnızca PT ödevlerinde |
| Lisans / ücretsiz koşul | ✅ ücretsiz, süresiz (S-07); lisans metni bu fazda okunmadı (A-11) | ✅ BSD 2-Clause, ücretsiz (S-16) | ◑ kalıcı deneme: FortiCloud hesabı başına 1 kopya, FortiGuard/FortiCare yok (S-17, S-19, S-55) | ❌ 30 gün (S-21); aktivasyon sorunları raporlanmış | ✅ NetAcad hesabıyla ücretsiz (S-25 ❔ — sayfa içeriği alınamadı) |
| Sanallaştırma / simülasyon desteği | ✅ Proxmox, VirtualBox, VMware, Hyper-V, KVM, Xen (S-02) → GNS3 QEMU node | ✅ ESXi, Xen, Hyper-V, KVM, VirtualBox (S-10) | ◑ VMware/KVM/Hyper-V/Xen (genel bilgi); VirtualBox resmî değil | ❌ ESXi/Hyper-V/KVM yalnızca; VirtualBox listede yok (S-20) | — (PT içinde) |
| VLAN ve routing | ✅ 802.1Q, statik; FRR eklentisi (genel bilgi) | ✅ 802.1Q, statik; FRR eklentisi (S-14 genel) | ◑ **3 arayüz, 3 route** sınırı (S-17/S-55) → 10 zone imkânsız | ✅ zone tabanlı | ◑ PT komut alt kümesi |
| VPN | ✅ IPsec IKEv1/v2, policy/VTI, mobil IKEv2 EAP (S-05); OpenVPN, WireGuard | ✅ IPsec IKEv1/v2 policy/VTI, OpenVPN yerleşik, WireGuard (S-14) | ✅ (deneme: low-encryption yalnızca — S-17) | ✅ IPsec; GlobalProtect ek lisans (S-21) | ◑ IKEv1 site-to-site |
| Bant genişliği şekillendirme / per-IP limit | ✅ **Limiter** per-IP mask, ağırlık, CoDel; **ALTQ** sınıf kuyrukları (S-03, S-04) | ✅ **Pipe/Queue/Rule**; kullanıcı başına limit how-to (S-11, S-12) | ✅ traffic shaper, per-IP shaper (genel bilgi); 3 policy sınırı ile pratik değil | ◑ QoS sınıf tabanlı (genel bilgi) | ❌ per-IP limit yok |
| Loglama / izleme | ✅ kural başına log, canlı görünüm, uzak syslog, RRD grafik (genel bilgi + S-13 eşdeğer model) | ✅ kural başına log, Live View, inspect modu (S-13) | ✅ (deneme: FortiAnalyzer yok) | ✅ | ◑ simüle syslog |
| Donanım / RAM | ✅ ≥ 1 GB RAM, 8 GB disk, amd64 (S-01) | ◑ kurulum ≥ 3 GB RAM; reasonable 4 GB (S-09, S-10) | ◑ deneme tavanı 1 vCPU / 2 GB (S-17) | ❌ VM-50 ≥ 5,5 GB (Lite 4,5), 60 GB disk (S-20) | ✅ ihmal edilebilir |
| Kurulum karmaşıklığı | Düşük–orta (ISO; GNS3 şablonu mevcut, genel bilgi) | Düşük–orta | Orta (hesap, lisans indirme) | Yüksek (hipervizör, lisans sunucusu) | Çok düşük |
| Ücretsiz/öğrenci erişimindeki kısıt | Yok | Yok | 3 arayüz / 3 policy / 3 route / 2 VDOM / low-encryption (S-17; birincil metin elle okunmadı) | 30 gün; yüksek RAM | NetAcad hesabı ❔ |
| **Güçlü yönler (proje için)** | En düşük RAM → 4 site tek makinede; per-IP limiter resmî belgeli; HA (CARP) belgeli (S-06); tarihli, çok kapsamlı dokümantasyon | İşlevsel denklik; modern arayüz; öngörülebilir 6 aylık sürüm döngüsü (S-15); OpenVPN/WireGuard yerleşik | Ticari NGFW arayüzü ve kavramları (app control, SD-WAN) tanıma | Zone tabanlı politika modeli ödevin kavramlarıyla birebir | Hiçbir kurulum yok; topoloji çizimi kolay |
| **Zayıf yönler (proje için)** | Unicast CARP yalnızca Plus; ALTQ throughput düşürür (S-04, S-06); DPI yerleşik değil | RAM pfSense'in ~3 katı; VMXNET3 ile shaper sorunu raporu (S-10) | Zone sayısı sınırı projeyi taşıyamaz; low-encryption | Süre, RAM, hipervizör; VirtualBox yok | pfSense/OPNsense yok; bant ve log testleri yapılamaz |

### 2.1 Doğrulama durumu

| İddia | Durum |
|---|---|
| pfSense CE 2.9.0 güncel ve desteklenen sürüm | ✅ S-07 (Netgate sürüm sayfası, 1 Eki 2026) |
| pfSense Limiter per-IP, garanti vermez | ✅ S-03 (19 Ara 2025) |
| OPNsense 26.7 güncel sürüm, BSD lisansı | ✅ S-15, S-16 |
| FortiGate-VM kalıcı deneme: 1 vCPU, 2 GB, 3 arayüz, 3 policy, 3 route, 2 VDOM | ◑ 7.2.7 ve 7.4.6 yönetim kılavuzlarının arama özetleri ve Ocak 2026 tarihli Fortinet topluluk gönderisi (7.6.5 kılavuzuna atıf, "lisans süresiz") aynı sınırları veriyor (S-17, S-55). **Birincil sayfa metni bu araştırmada elle okunamadı** → uygulama öncesi tarayıcıyla teyit |
| VM-Series RAM/hipervizör | ✅ S-20 (23 Eyl 2026) |
| Packet Tracer sürüm/lisans | ❔ S-25 içerik vermedi; S-51/S-52 üçüncü taraf |
| GNS3 sistem gereksinimleri | ✅ S-22 (Windows); Linux/macOS okunmadı |
| EVE-NG ücretsiz katman node sınırı | ❔ S-23 resmî sayfa iç çelişkili (7 vs 63); S-50 üçüncü taraf |

## 3. GNS3 + GNS3 VM + pfSense CE önerisinin yeniden değerlendirilmesi

Önceki araştırma (ADR-002/003) bu kombinasyonu birincil aday göstermişti. Aşağıda ödevin somut soruları üzerinden yeniden sınanır; otomatik onay değildir.

| Soru | Değerlendirme | Sonuç |
|---|---|---|
| **Seçilen ürün ödevin istediği özellikleri gerçekten gösterebiliyor mu?** | Stateful/NAT (S-04), VLAN, IPsec IKEv2 VTI ve mobil istemci (S-05), per-IP Limiter + ALTQ (S-03/S-04), kural bazlı log, CARP HA (S-06) resmî belgelerle mevcut. Gösterilemeyen: merkezi çoklu-firewall yönetimi (G-17, isteğe bağlı) ve yerleşik DPI (G-12, isteğe bağlı) | ✅ Zorunlu gereksinimlerin tümü; isteğe bağlılar eklenti veya belge ile |
| **Bant genişliği limitleri gerçek trafik üzerinde test edilebilir mi?** | GNS3 gerçek pfSense imajını çalıştırır; Alpine istemcilerde iperf3 ile gerçek TCP/UDP akışları üretilir; Limiter sayaçları ve link üzerinde Wireshark ile ölçüm alınır. Sanal CPU paylaşımı nedeniyle **mutlak** throughput anlamsız, **oransal** doğrulama (±%15, NFR-13) anlamlıdır | ✅ Evet, oransal/mekanizma düzeyinde (T-B1, T-B2). Packet Tracer'da mümkün değil |
| **Site-to-site VPN simülasyonu yapılabilir mi?** | İki pfSense arasında IKEv2 VTI; ISP-SIM node ile "internet" üzerinden; pcap'te ESP görünür; kesinti/kurtarma GNS3 link suspend ile | ✅ (T-V1, T-V2, T-F2) |
| **Akademik şubenin güvenlik bölgeleri uygulanabilir mi?** | Tek pfSense'e trunk + GNS3 802.1Q anahtarı ile 10+ VLAN; FortiGate denemesinde bu **3 arayüz** nedeniyle mümkün değildir | ✅ pfSense/OPNsense ile; ❌ FortiGate deneme ile |
| **Öğrencinin bilgisayarında kaç VM ile makul başlangıç topolojisi kurulabilir?** | Tam topoloji: 4 pfSense (4 × 1 GB) + ISP-SIM (1 GB) + 6 Alpine (6 × 256 MB) + GNS3 VM (~2 GB) ≈ **8,5 GB** VM + ana işletim sistemi ~4 GB → **16 GB makine** (S-22 "önerilen" ile uyumlu). **Minimum başlangıç:** ISP-SIM + Ankara + Akademik + 3 Alpine ≈ 4,5 GB VM → **8 GB makine** ile çalışabilir (ADR-005) | ✅ 6–12 VM; 8 GB'ta küçültülmüş, 16 GB'ta tam |
| **Ürün sürümü ve lisans koşulları uygun mu?** | pfSense CE 2.9.0 destekli ve ücretsiz (S-07); süre sınırı yok; GNS3 ücretsiz (lisans dosyası A-11). OPNsense 26.7 aynı şekilde uygun ancak RAM ×3 | ✅; A-11 küçük açık kalem |

**Yeniden değerlendirme sonucu:** Öneri **korunur**. Değişen tek şey, FortiGate-VM deneme sınırlarının artık birden fazla sürümün belgeleriyle (arama özetleri düzeyinde) desteklenmesidir; bu, FortiGate'in "ileri seviye/ticari" kategorisinde kalmasını güçlendirir. Önceki belgelerle çelişen bir bulgu **yoktur**; karar günlüğüne ADR-011 olarak işlenmiştir.

### 3.1 Birincil önerinin bilinen riskleri ve azaltımları

| Risk | Azaltım |
|---|---|
| GNS3 VM ↔ hipervizör uyumsuzluğu (Windows'ta Hyper-V/WSL2 ile VirtualBox/VMware çakışması) | Alternatif yol: VirtualBox/VMware'de doğrudan pfSense (Öneri 2); kurulum rehberi lab başında denenir |
| Ana makine RAM'i 8 GB | ADR-005 küçültülmüş topoloji; VPCS ile Alpine yerine ping-only istemciler |
| Limiter + ALTQ birlikte davranışı | T-B2'de önce QoS kapalı referans ölçüm, sonra açık; sapmalar ADR'ye yazılır |
| pfSense CE yol haritası belirsizliği (Netgate ticari odağı Plus) | Ödev süresi için risk yok; OPNsense'e geçiş maliyeti düşük (belgeler ürün-bağımsız) |

## 4. Öneri ve gerekçe

### 4.1 Birincil güvenlik duvarı: **pfSense CE 2.9**
- **Gerekçe:** G-01..G-10 ve G-13..G-15'in tümünü resmî belgelerle karşılar; 1 GB RAM ile dört siteyi tek makinede çalıştırmaya en elverişli; per-IP Limiter belgesi ödevin bant genişliği gösterimini doğrudan destekler; HA ve IPsec belgeleri tarihli ve ayrıntılı.
- **Kısıt:** Unicast CARP ve bazı özellikler Plus'ta; ALTQ throughput maliyeti; DPI yok.

### 4.2 Alternatif güvenlik duvarı: **OPNsense 26.7**
- **Gerekçe:** İşlevsel denklik (Pipe/Queue/Rule, IPsec VTI, OpenVPN/WireGuard yerleşik, CARP); modern arayüz; öngörülebilir sürüm döngüsü; BSD lisansı.
- **Ne zaman:** Ekip arayüz tercihi; pfSense kurulumunda sorun; ya da dersin OPNsense istemesi.
- **Kısıt:** Kurulum için ≥ 3 GB RAM → 4 site ≈ 12 GB yalnızca firewall'lar için; 16 GB makinede küçültme gerekebilir.

### 4.3 İleri seviye / ticari alternatif: **FortiGate-VM kalıcı deneme** (ikincil: Palo Alto VM-Series 30 gün)
- **Amaç:** Ticari NGFW arayüzü, uygulama kontrolü ve politika modelini **tek sitede, 2–3 zone ile** göstermek; açık kaynak ile karşılaştırma yazısı.
- **Kısıt:** 3 arayüz / 3 policy / 3 route (teyit gerekli); low-encryption; FortiGuard yok. VM-Series için ESXi/KVM/Hyper-V ve ≥ 5,5 GB RAM, 30 gün.
- **Koşul:** Yalnızca Q-05 "ticari karşılaştırma bekleniyor" ise ve birincil lab tamamlandıktan sonra.

### 4.4 Reddedilen: Packet Tracer (birincil olarak)
Gerçek firewall yazılımı çalıştırmaz; per-IP limit, gerçek log ve iperf ölçümü yoktur; ödevin B ve F bölümleri gösterilemez. Q-01 "Packet Tracer zorunlu" derse ASA tabanlı tasarım uygulanır ve bant/log testleri "PT'de uygulanamaz" olarak raporlanır.

## 5. Nihai karar tablosu

| Kriter | Önerilen çözüm | Gerekçe | Kısıt / doğrulama ihtiyacı |
|---|---|---|---|
| **Birincil firewall** | pfSense CE 2.9.0 | Zorunlu gereksinimlerin tümü resmî belgeli (S-01..S-07); 1 GB RAM/instance; per-IP Limiter + ALTQ; IKEv2 VTI; CARP HA; tarihli dokümantasyon | Unicast CARP yalnızca Plus (S-06); ALTQ throughput düşürür (S-04); DPI yerleşik değil; CE lisans metni elle okunmadı (A-11) |
| **Alternatif firewall** | OPNsense 26.7 | İşlevsel denklik: Pipe/Queue/Rule (S-11), IPsec VTI + OpenVPN + WireGuard (S-14), BSD lisansı (S-16), 6 aylık sürüm döngüsü (S-15); VirtualBox/KVM desteği (S-10) | Kurulum ≥ 3 GB RAM (S-09/S-10) → 4 site için ~12 GB; VMXNET3 shaper raporu (S-10); HA belgesi bu fazda okunmadı |
| **Simülasyon ortamı** | GNS3 + GNS3 VM (birincil); VirtualBox/VMware Workstation doğrudan (alternatif); EVE-NG/Proxmox (ileri) | Gerçek imaj çalıştırır, yerleşik 802.1Q anahtar, görsel topoloji, Wireshark; ücretsiz; 16 GB önerilir (S-22). Packet Tracer gereksinimleri karşılamaz (S-51) | Donanım: ≥ 16 GB tam topoloji, 8 GB küçültülmüş (ADR-005); GNS3 VM ↔ hipervizör uyumu; EVE-NG ücretsiz katman node sınırı belirsiz (S-23/S-50 ❔) |
| **VPN yaklaşımı** | IPsec IKEv2, route-based (VTI), Ankara merkezli hub-and-spoke, statik yönlendirme; remote-access için lab'da OpenVPN (IKEv2 EAP belgelenir) | Standart ve birlikte çalışabilir (S-05, S-14); 3 tünel yönetim basitliği; IP planı full-mesh'e hazır (NFR-18) | Test kapsamı: tünel kurulumu, NAT'sız uçtan uca, spoke-spoke gecikme, kesinti/kurtarma (T-V1..V3, T-F2); dinamik yönlendirme ertelendi (ADR-004); MTU/MSS lab'da gözlenir |
| **Bant genişliği yönetimi** | Per-IP Limiter (adalet: öğrenci, misafir) + ALTQ/ağırlıklı kuyruk (öncelik: kritik, gerçek zamanlı) + zamanlama (bulk) | pfSense Limiter per-IP mask ve ağırlık resmî (S-03); ALTQ sınıf garantisi (S-04); OPNsense eşdeğeri (S-11/S-12); kapasite talep modeliyle hesaplanır (`tahmini-bant-genisligi.md`) | Limiter garanti vermez (S-03); Limiter + ALTQ birlikte davranışı lab'da doğrulanmalı (T-B1/T-B2); DPI/uygulama farkındalığı eklenti ister; lab ölçeği oransal (V-13) |

## 6. Öğretim görevlisi onayı gereken noktalar

Q-01 (emülasyon kabulü), Q-04 (site sayısı), Q-05 (ticari ürün karşılaştırması), Q-06 (HA), Q-07 (IDS/IPS). Varsayılan davranışlar `../requirements/assumptions-and-open-questions.md` §4'te.


---

# Tahmini bant genişliği


**Belgenin amacı:** Her lokasyon ve ekip için internet kapasitesinin *nasıl* hesaplanacağını, akademik şube için üç kullanım senaryosunu ve simülasyonda kullanılacak başlangıç değerlerini tek bir teslim belgesinde toplamak.
**İlişkili belgeler:** Kavramsal arka plan ve QoS mekanizmaları → [`bandwidth-planning.md`](bandwidth-planning.md); uygulanacak hız sınıfları → [`../policies/bandwidth-policy.md`](../policies/bandwidth-policy.md); varsayım kimlikleri → [`../requirements/assumptions-and-open-questions.md`](../requirements/assumptions-and-open-questions.md); kaynak kimlikleri (S-xx) → [`sources-and-references.md`](sources-and-references.md).
**Etiketler:** (F) olgu · (V) varsayım · (Ö) örnekleyici sayı · (A) ölçüm/araştırma gerekli · (K) kaynaklı.
**Tarih:** 2026-10-23

> ⚠ **Bu belgedeki hiçbir Mbps/Gbps değeri ölçülmüş bir gereksinim değildir.** Tümü, etiketlenmiş varsayımlardan türetilen **simülasyon başlangıç değerleridir**. Gerçek kapasite kararı yalnızca §7'de listelenen ölçümler yapıldıktan sonra verilebilir. Yükseköğretim kampüsleri için güncel ve yetkili bir "öğrenci başına bant genişliği" kıyas kaynağı bu araştırmada **bulunamamıştır** (A-04); bu nedenle sayılar akademik sektör standardı olarak sunulmaz.

## 1. Hesaplama modeli

### 1.1 Değişkenler

| Sembol | Anlamı | Nereden gelir |
|---|---|---|
| **N** | Toplam kullanıcı sayısı (grup başına) | F-02 (öğrenci), V-06 (personel, Ö) |
| **c** | Eşzamanlı aktif kullanıcı oranı: yoğun saatte gerçekten trafik üreten kullanıcı / N | Ölçüm gerekir (A-03); senaryolarla çevrelenir |
| **b↓ / b↑** | Aktif kullanıcı başına **ortalama** anlık indirme / yükleme talebi (Mbps) | Kullanım profili (web, video, konferans, indirme) |
| **p** | Tepe katsayısı: yoğun saatteki 5–15 dakikalık en yüksek değerin saatlik ortalamaya oranı (burst payı) | Ölçüm; (Ö) 1,3–1,4 |
| **k** | Önbellek/yerel servis azaltma oranı: WAN'a çıkmayan indirme payı (yerel LMS, paket önbelleği, güncelleme sunucusu, imaj dağıtımı) | Mimari karar; (Ö) |
| **o** | VPN ek yükü: siteler arası trafiğin IPsec (ESP + IKE) başlıkları ve yeniden iletim payı | (Ö) %8–10; yalnızca siteler arası trafiğe uygulanır |
| **T** | Siteler arası (VPN) trafik: merkezi servislere giden/gelen akışlar | Hub için spoke'lardan gelen toplam |
| **u** | Hedef tepe kullanım oranı: kuyruklanma ve gecikme artışını önlemek için devre kapasitesinin kullanılacak payı | (Ö) 0,75 — genel operatör pratiği (S-53, anekdot) |
| **g** | Büyüme payı: kapasite kararının geçerli kalması istenen ufuk (2 yıl) için talep artışı | (Ö) ×1,25 |

### 1.2 Formüller

1. **Yoğun saat indirme talebi (kullanıcı grubu için):**
   `D_grup = N × c × b↓ × p`
2. **Yoğun saat yükleme talebi:**
   `U_grup = N × c × b↑ × p`
3. **Lokasyon toplam talebi:** grupların toplamı: `D = Σ D_grup`, `U = Σ U_grup`
4. **WAN'a yansıyan indirme talebi (önbellek sonrası):**
   `D_WAN = D × (1 − k)` (k yalnızca önbelleklenebilir trafiğe uygulanır; konferans/video akışı gibi önbelleklenemeyen trafik için k = 0 kabul edilir)
5. **Siteler arası trafik ek yükü:** `T_WAN = T × (1 + o)` (yalnızca VPN üzerinden geçen kısım)
6. **Gereken devre kapasitesi (asimetrik devrelerde yön başına ayrı):**
   `C_gerekli = max(D_WAN + T_WAN, U + T_WAN) / u`
7. **Büyüme ile kontrol:** seçilen standart devre kademesi `C_seçilen` için `(D_WAN + T_WAN) × g / C_seçilen ≤ u` sağlanmalı; sağlanmıyorsa bir kademe yukarı veya yükseltme opsiyonu.
8. **Tahmini kullanım oranı:** `kullanım = (D_WAN + T_WAN) / C_seçilen`

### 1.3 Çift sayım uyarıları

- **p ile g farklı şeyleri ölçer:** p *bugünkü* yoğun saat içindeki dalgalanmadır, g *gelecekteki* talep artışıdır. İkisi birden çarpılır ama aynı unsuru temsil etmez.
- **u, p'nin yerine geçmez:** p talebin kendisini büyütür; u, devrenin ne kadarının dolu çalıştırılacağını belirler (kuyruk/gecikme payı).
- **Kullanıcı başına limit (tavan) formülde yoktur.** Tavan, tek bir kullanıcının havuzu tüketmesini engelleyen bir *politika* aracıdır; talebi belirlemez. Öğrenciye 20 Mbps tavan vermek, 10.000 öğrencinin 200 Gbps tüketeceği anlamına gelmez; ortalama aktif talep (b) 1–2 Mbps düzeyindedir. Fark `bandwidth-planning.md` §1'de kavramsal olarak açıklanmıştır.
- **Siteler arası trafik, hem spoke hem hub tarafında sayılır** (her ikisinin WAN'ından geçer); ancak aynı sitede iki kez sayılmaz.
- **Bulk (toplu) trafik** mesai dışına zamanlanıyorsa tepe talebe eklenmez; gündüz çalışacaksa eklenir (bkz. §4.4, §4.6).

### 1.4 Kıyas noktaları (sınırlı)

| Kaynak | Değer | Uygulanabilirlik |
|---|---|---|
| ABD FCC/E-rate K-12 hedefleri (K, S-43) | 100 kbps/öğrenci asgari; 1 Mbps/öğrenci (2017-18) — *kayıtlı* öğrenci başına, tepe değil | **K-12**; yükseköğretime doğrudan aktarılamaz. 10.000 öğrenci için 1 Mbps/öğrenci = 10 Gbps; bu belgenin S2–S3 aralığıyla aynı mertebededir |
| Üniversite planlama anekdotu, 2010 (T, S-56) | "1000 öğrenci başına 100 Mbps" ve "1 GE/1000 öğrenciye kimse sahip değil" ifadeleri | Eski ve anekdot; yalnızca kavramsal alt sınır |
| Meraki Wi-Fi tasarım yaklaşımı (K, S-40/S-41) | Önce kullanıcı başına throughput hedefi, sonra AP sayısı | Erişim katmanı için yöntem; WAN kapasitesi için değil |

## 2. Akademik şube — üç senaryo

### 2.1 Ortak varsayımlar

| Girdi | Değer | Etiket |
|---|---|---|
| Öğrenci N | 10.000 | F-02 |
| Personel N (akademik 600 + idari 300 + teknik 100) | 1.000 | V-06 (Ö) |
| Personel c / b↓ / b↑ | 0,60 / 1,5 Mbps / 0,5 Mbps | Ö (tüm senaryolarda sabit; değişken olan öğrenci davranışıdır) |
| Önbellek azaltma k | 0,10 (yerel LMS, güncelleme sunucusu, imaj dağıtımı) | Ö |
| Hedef kullanım u | 0,75 | Ö |
| Büyüme g (2 yıl) | 1,25 | Ö |
| Siteler arası T (Ankara'ya merkezi servisler) | ~180 Mbps (600 aktif personel × 0,3 Mbps) → T_WAN ≈ 200 Mbps | Ö; akademik WAN'a göre küçük, ayrıca gösterilir |
| İndirme/yükleme oranı (öğrenci) | yaklaşık 4:1 | Ö; video ağırlıklı tüketim |

### 2.2 Senaryo tablosu

| Girdi / çıktı | **S1 — Düşük** | **S2 — Orta** | **S3 — Yüksek** |
|---|---|---|---|
| Profil | Gündüz kampüsü, yurt yok, dersler yüz yüze, video sınırlı | Hibrit dersler, yaygın video, lab günleri | Yurtlu kampüs, akşam akış videosu, sınav haftası, çevrim içi kayıt günü |
| Öğrenci c | 10 % | 20 % | 35 % |
| **Eşzamanlı öğrenci** | **1.000** | **2.000** | **3.500** |
| Öğrenci b↓ / b↑ | 1,0 / 0,25 Mbps | 1,5 / 0,40 Mbps | 2,0 / 0,50 Mbps |
| p | 1,3 | 1,3 | 1,4 |
| Öğrenci D / U | 1,30 / 0,33 Gbps | 3,90 / 1,04 Gbps | 9,80 / 2,45 Gbps |
| Personel D / U (600 aktif) | 1,17 / 0,39 Gbps | 1,17 / 0,39 Gbps | 1,17 / 0,39 Gbps |
| **Toplam D / U (LAN'da görülen)** | **2,47 / 0,72 Gbps** | **5,07 / 1,43 Gbps** | **10,97 / 2,84 Gbps** |
| D_WAN = D × 0,9 | 2,22 Gbps | 4,56 Gbps | 9,87 Gbps |
| + T_WAN (0,2 Gbps) | 2,42 Gbps | 4,76 Gbps | 10,07 Gbps |
| **Tahmini indirme talebi (WAN, tepe)** | **≈ 2,4 Gbps** | **≈ 4,8 Gbps** | **≈ 10,1 Gbps** |
| **Tahmini yükleme talebi (WAN, tepe)** | **≈ 0,9 Gbps** | **≈ 1,6 Gbps** | **≈ 3,0 Gbps** |
| C_gerekli = 2,4 / 0,75 vb. | 3,2 Gbps | 6,3 Gbps | 13,4 Gbps |
| **Önerilen devre (standart kademe, simetrik)** | **2 × 2 Gbps (4 Gbps, yedekli)** | **1 × 10 Gbps** (veya 2 × 5 Gbps yedekli) | **2 × 10 Gbps (20 Gbps, yedekli)** |
| **Tahmini kullanım oranı (bugün)** | 60 % | 48 % | 50 % |
| Büyüme ile (×1,25) kullanım | 75 % — sınırda | 60 % | 63 % |
| Avantajlar | Düşük maliyet; iki devre ile yedeklilik | Tek devre basit; geniş pay; S1→S2 geçişinde yeterli | S3 tepe günlerinde dahi pay var; yedeklilik |
| Riskler | Hibrit/video artışında 1–2 yılda doyar; tek 4 Gbps'te yedek devre düşerse %100+ | Tek devre = tek arıza noktası (yedek için 2 × 5 Gbps); yurtlu kampüse dönüşte yetersiz | Maliyet; gündüz kampüsünde atıl kapasite |

**Yorum:** Senaryolar arasında yaklaşık **4 kat** fark vardır; fark kullanıcı sayısından değil, c ve b'den kaynaklanır. Bu, "10.000 × tavan" hesabının neden anlamsız olduğunu gösterir: 10.000 × 20 Mbps = 200 Gbps nominal toplam, oysa en yüksek senaryoda bile tepe talep ~10 Gbps'tir (yaklaşık 20:1 oversubscription, kampüs ağlarında olağan).

**Planlama tabanı önerisi (V-08):** S2 ile başla (1 × 10 Gbps), sözleşmeye S3 için yükseltme opsiyonu (2 × 10 Gbps) koy; Q-08 (yurt var mı?) cevabı S1/S3 arasında belirleyicidir.

### 2.3 Senaryo karşılaştırması (özet)

| | S1 | S2 | S3 |
|---|---|---|---|
| Eşzamanlı kullanıcı (öğr. + pers.) | 1.600 | 2.600 | 4.100 |
| Tepe indirme (WAN) | 2,4 Gbps | 4,8 Gbps | 10,1 Gbps |
| Tepe yükleme (WAN) | 0,9 Gbps | 1,6 Gbps | 3,0 Gbps |
| Devre | 2 × 2 Gbps | 10 Gbps | 2 × 10 Gbps |
| Kullanım (bugün / 2 yıl) | 60 % / 75 % | 48 % / 60 % | 50 % / 63 % |
| Ne zaman geçerli | Yurt yok, video sınırlı | Hibrit kampüs (varsayılan taban) | Yurtlu kampüs, sınav/kayıt tepe günleri |

## 3. Ofisler — hesaplama ve doldurulabilir tablo

Ofis personel sayıları ödevde yoktur (F-07); aşağıdaki değerler **V-06 (Ö)**'dür. Gerçek değerler geldiğinde (A-01, A-02) aynı tabloyu doldurmak yeterlidir.

### 3.1 Ortak varsayımlar (Ö)

Personel c = 0,60; b↓ = 1,5 Mbps; b↑ = 0,5 Mbps; p = 1,3; k = 0,10 (güncelleme/önbellek); o = 0,10; u = 0,75; g = 1,25. Siteler arası trafik: aktif kullanıcı × 0,3 Mbps (merkezi ERP/İK/dosya/kimlik; Ö).

### 3.2 Ankara (HQ, VPN hub)

| Kalem | Hesap | Sonuç |
|---|---|---|
| Kullanıcı N | 150 personel + 15 IT-Ops (V-06) | 165 |
| Aktif | 165 × 0,60 | ≈ 100 |
| Yerel internet D / U | 100 × 1,5 × 1,3 / 100 × 0,5 × 1,3 | 195 / 65 Mbps |
| D_WAN (k = 0,10) | 195 × 0,9 | 176 Mbps |
| **Hub geçiş trafiği T** (spoke'lardan gelen merkezi servis trafiği) | İstanbul 120 aktif × 0,3 = 36; Londra 20 × 0,3 = 6; Akademik 600 × 0,3 = 180 | 222 Mbps |
| T_WAN (o = 0,10) | 222 × 1,1 | ≈ 245 Mbps (çift yönlü) |
| Spoke-spoke geçişi (hub üzerinden iki kez) | V: düşük; İstanbul ↔ Akademik Ar-Ge kodu, ~20 Mbps | +20 Mbps |
| **Tepe WAN talebi (indirme yönü)** | 176 + 245 + 20 | **≈ 440 Mbps** |
| **Tepe WAN talebi (yükleme yönü)** | 65 + 245 + 20 | **≈ 330 Mbps** |
| C_gerekli | 440 / 0,75 | 590 Mbps |
| **Önerilen devre** | Standart kademe | **1 Gbps simetrik** (kullanım ≈ 44 %; büyüme ile 55 %) |
| Not | Gece yedekleme (§4.4) bu devreden geçer; dedup/yerel yedek yoksa 1 Gbps yetmeyebilir | A |

### 3.3 İstanbul (ofis + Yazılım, V-03)

| Kalem | Hesap | Sonuç |
|---|---|---|
| Ofis personeli | 100 × 0,60 = 60 aktif; D 60 × 1,5 × 1,3; U 60 × 0,5 × 1,3 | 117 / 39 Mbps |
| Geliştiriciler (c = 0,80, b↓ = 5 Mbps ort. — burst ağırlıklı, b↑ = 1,5) | 60 × 0,80 = 48 aktif; D 48 × 5 × 1,3; U 48 × 1,5 × 1,3 | 312 / 94 Mbps |
| CI ajanları (10 ajan × 10 Mbps ort. indirme, 5 Mbps yükleme; Ö) | gündüz çalıştığı varsayımıyla | 100 / 50 Mbps |
| Toplam D / U | | 529 / 183 Mbps |
| Önbellek (geliştirici + CI için k = 0,40; ofis için 0,10) | 117 × 0,9 + (312 + 100) × 0,6 | 105 + 247 = 352 Mbps |
| Siteler arası T_WAN | 120 aktif × 0,3 × 1,1 | 40 Mbps |
| **Tepe WAN talebi D / U** | 352 + 40 / 183 + 40 | **≈ 390 / 225 Mbps** |
| C_gerekli | 390 / 0,75 | 520 Mbps |
| **Önerilen devre** | | **1 Gbps simetrik** (kullanım 39 %; büyüme 49 %). Asgari: 500 Mbps (78 % — sınır üstü, önerilmez) |
| Not | Paket/artefakt/registry önbelleği (k = 0,40) olmazsa D_WAN ≈ 560 Mbps → 1 Gbps'te 56 %; önbellek, kapasiteden ucuzdur | V |

### 3.4 Londra

| Kalem | Hesap | Sonuç |
|---|---|---|
| Personel | 30 × 0,60 = 18 ≈ 20 aktif | |
| D / U | 20 × 1,5 × 1,3 / 20 × 0,5 × 1,3 | 39 / 13 Mbps |
| D_WAN + T_WAN | 39 × 0,9 + (20 × 0,3 × 1,1) | 35 + 7 = 42 Mbps |
| Konferans payı (zaman farkı nedeniyle çok video; ekstra 10 kullanıcı × 3 Mbps) | | +30 Mbps |
| **Tepe WAN talebi** | | **≈ 70 / 45 Mbps** |
| C_gerekli | 70 / 0,75 | 95 Mbps |
| **Önerilen devre** | | **200 Mbps simetrik** (kullanım 35 %; 100 Mbps'te 70 % — sınırda) |
| Not | Tek WAN + uzak yönetim → mobil yedek bağlantı (4G/5G) düşünülebilir (V-09 dışı, A) | A |

### 3.5 Doldurulabilir şablon (gerçek veriler için)

| Girdi | Ankara | İstanbul | Londra | Akademik |
|---|---|---|---|---|
| N (grup başına) | | | | |
| c (ölçülen) | | | | |
| b↓ / b↑ (ölçülen, Mbps) | | | | |
| p (ölçülen 95. yüzdelik / ortalama) | | | | |
| k (önbellek isabet oranı) | | | | |
| T (siteler arası, Mbps) | | | | |
| Mevcut devre (Mbps) | | | | |
| Ölçülen tepe kullanım (%) | | | | |
| **C_gerekli = max(D_WAN+T_WAN, U+T_WAN) / 0,75** | | | | |

## 4. Ekiplerin iş yükleri

Ekiplerin konumu kesin değildir (F-06); V-02..V-04 kullanılmıştır ve Q-02 ile onaylanmalıdır. Kullanıcı sayıları V-06 (Ö).

### 4.1 Yazılım Ekibi (İstanbul, V-03)
- **Karakter:** Kısa, yoğun burst'ler (git clone, npm/pip/Maven, container imajı); konferans sürekli.
- **Hesap:** §3.3'te. Temel kaldıraç **yerel önbellek** (Nexus/Artifactory/registry aynası): k = 0,40 ile WAN talebi ~%35 düşer.
- **Politika:** BW-05 "Geliştirici burst" (yüksek per-IP tavan, orta öncelik); CI → BW-06.

### 4.2 Ar-Ge Ekibi (Akademik, V-04)
- **Etkileşimli:** 40 × 0,85 = 34 aktif × 2 Mbps × 1,3 ≈ 90 Mbps — akademik toplamın içinde ihmal edilebilir.
- **Büyük veri transferi (A-09):** Ortalama hız = hacim × 8 / süre. Örnek (Ö): günde 1 TB indirme → 24 saate yayılırsa `1×10¹² × 8 / 86.400 s ≈ 93 Mbps`; 8 saatlik mesaiye sıkışırsa ≈ 280 Mbps; 2 saatlik gece penceresinde ≈ 1,1 Gbps.
- **Sonuç:** Gündüz çalışırsa akademik tepe talebine +0,3 Gbps eklenir (S2'de 10 Gbps içinde kalır); gece zamanlanırsa (BW-06) tepe talebi etkilemez. Veri hacmi ölçülmeden karar verilmez.

### 4.3 BT ve Ağ Operasyonları (Ankara, V-02)
- **Uzaktan yönetim:** HTTPS/SSH/SNMP/syslog — hacim küçük (siteler arası T içinde; Ö 5–10 Mbps toplam), ancak **gecikmeye duyarlı** → BW-01.
- **Merkezi log:** 4 firewall + anahtarlar; Ö 2–5 Mbps sürekli.
- **Yedekleme (siteler → Ankara):** Örnek (Ö): günlük artımlı 2 TB, 6 saatlik gece penceresi → `2×10¹² × 8 / 21.600 ≈ 740 Mbps`. Bu, Ankara'nın 1 Gbps devresinde %74 → gece için kabul edilebilir ama gündüze taşarsa çatışır. Tasarım seçenekleri: yerel yedek + dedup/replikasyon, pencereyi uzatma, Ankara'yı 2 Gbps'e çıkarma. Girdi: yedek hacmi (A).

### 4.4 Toplu trafik kuralı
Bulk trafik (yedek, imaj dağıtımı, veri seti, güncelleme) **mesai dışına zamanlanır**; gündüz çalışması zorunluysa BW-06 ile en düşük öncelikte ve tavanlı çalışır ve tepe talep hesabına **eklenir**.

## 5. Kapasite ile hız politikasının ayrımı

| Konu | Lokasyonun toplam internet kapasitesi | Kullanıcı/grup başına hız politikası |
|---|---|---|
| Soru | "Devreyi kaç Gbps alacağız?" | "Tek bir kullanıcı/grup en fazla ne kadar alabilir, tıkanıklıkta kim önce?" |
| Girdi | c, b, p, k, T, u, g (§1) | Adalet, iş önceliği, kötüye kullanım önleme |
| Araç | ISP sözleşmesi, devre kademesi | Firewall limiter/shaper/kuyruk |
| Değişim sıklığı | Yıllık | Dönemlik (sınav haftası vb.) |

### 5.1 Özet politika tablosu (ayrıntı: `policies/bandwidth-policy.md`)

Tüm değerler **Ö — simülasyon başlangıç varsayımı**; üretim ölçeğinde yazılmıştır, lab ölçeği için bkz. §6.

| Grup | Sınıf | Öncelik | Yaklaşım | Per-IP tavan (Ö) | Gerekçe |
|---|---|---|---|---|---|
| Kritik servisler (MGMT, DNS, NTP, IKE, syslog) | BW-01 | 1 | Garanti hedefi (ALTQ kuyruğu) + yüksek ağırlık | — | Ağ ayakta kalmalı |
| Gerçek zamanlı (VoIP, konferans) | BW-02 | 2 | Düşük gecikme kuyruğu, CoDel | — | Kayba duyarlı |
| Akademisyen / personel (STAFF) | BW-03 | 3 | Per-IP limiter + ağırlık 70 | 50 ↓ / 20 ↑ Mbps | Üretkenlik, adalet |
| İdari personel (ADMIN) | BW-03 | 3 | Per-IP limiter + ağırlık 70 | 50 / 20 Mbps | Aynı; hassas uygulamalar |
| Öğrenci (STUDENT, LAB) | BW-04 | 4 | Per-IP limiter (adalet) + ağırlık 40; P2P engeli | 20 / 5 Mbps | En büyük taban; tek kullanıcı havuzu tüketmemeli |
| Yazılım (SW-DEV) | BW-05 | 3 | Per-IP yüksek tavan + önbellek | 100 / 50 Mbps | Burst karakteri |
| Ar-Ge (RND) + CI + yedek | BW-06 | 5 | Sınıf havuzu + zamanlama | sınıf tavanı | Boş kapasiteyi kullanır |
| Misafir (GUEST) | BW-07 | 6 | Sert havuz tavanı ≤ %5 + per-IP | 5 / 2 Mbps | Kimliksiz |

### 5.2 Kavram ayrımı ve platform desteği

| Kavram | Ne yapar | pfSense CE desteği (K) | OPNsense desteği (K) |
|---|---|---|---|
| **Policing** (sert tavan, aşan paket düşer) | Per-IP/per-subnet veya havuz tavanı | **Limiter** (dummynet): source/destination mask ile per-IP; sabit tavan, borrow/garanti yok (S-03) | **Pipe** (dummynet/IPFW) (S-11, S-12) |
| **Shaping** (kuyruklama, geciktirme) | Çıkış yönünde tıkanıklık yönetimi | **ALTQ** (HFSC/CBQ/PRIQ/FAIRQ); throughput'u düşürür uyarısı (S-04) | Pipe + Queue ağırlıkları (S-11) |
| **Önceliklendirme / ağırlık** | Tıkanıklıkta paylaşım | Limiter kuyruk ağırlığı 1–100, açlık yok (S-03); ALTQ öncelik | Queue weight (S-11) |
| **Garanti (minimum)** | Sınıfa asgari bant | Yalnızca ALTQ (HFSC); Limiter garanti **vermez** (S-03) | Queue ağırlığı oransal paylaşım; "strict garanti" değil (S-11) |
| **AQM (CoDel/FQ-CoDel)** | Gecikme/bufferbloat | Limiter CoDel seçeneği (S-03) | Pipe scheduler seçenekleri (S-11) |
| **Uygulama farkındalığı (DPI)** | Uygulamaya göre sınıflama | Yerleşik değil; eklenti/ticari NGFW (genel bilgi) | Yerleşik değil; eklenti (genel bilgi) |

**Sonuç:** Per-IP adalet (BW-04, BW-07) her iki platformda yerleşik olarak desteklenir ve resmi belgelerle doğrulanmıştır. "Kritik servis garantisi" (BW-01/02) pfSense'te ALTQ gerektirir; Limiter + ALTQ birlikte kullanımının davranışı lab'da **T-B2** ile gözlemlenecektir (henüz test edilmedi).

## 6. Simülasyonda kullanılacak başlangıç değerleri

Lab ölçeği V-13: WAN için 1000:1, per-IP tavanlar için 10:1 (ölçüm kolaylığı; oversubscription oranı üretimden düşük olur, testler mekanizmayı doğrular).

| Üretim (Ö) | Lab başlangıç değeri | Test |
|---|---|---|
| Akademik WAN 10 Gbps (S2) | 10 Mbps (GNS3 link filtresi veya WAN limiter) | T-B2 |
| Ankara / İstanbul WAN 1 Gbps | 1 Mbps (oransal; veya 10 Mbps'te bırakılıp yalnızca akademik daraltılır) | — |
| Londra WAN 200 Mbps | 0,2 Mbps (çok düşük; pratikte 1 Mbps) | T-F2 |
| Öğrenci per-IP 20 / 5 Mbps | 2 / 0,5 Mbps | T-B1 |
| Misafir havuzu %5 → 500 Mbps | 500 kbps havuz; per-IP 0,5 / 0,2 Mbps | T-B1 |
| Kritik garanti hedefi %5 | 500 kbps ALTQ kuyruğu | T-B2 |
| Bulk sınıfı gündüz tavanı %10 | 1 Mbps | T-B3 |
| Beklenen doğruluk | ölçülen ≈ yapılandırılan ± %15 (NFR-13) | T-B1 |

## 7. Gerçek dünyada ölçülmesi gerekenler

| Ölçüm | Yöntem | Hangi değişkeni besler |
|---|---|---|
| Eşzamanlı aktif kullanıcı (yoğun saat) | DHCP kira sayısı + firewall state/akış sayısı; NetFlow | c |
| Aktif kullanıcı başına ortalama talep | Toplam yoğun saat trafiği / aktif kullanıcı | b↓, b↑ |
| Tepe/ortalama oranı | 5 dk SNMP sayaçlarının 95. yüzdeliği / saatlik ortalama | p |
| Önbellek isabet oranı | Proxy/artefakt sunucusu istatistikleri | k |
| Siteler arası trafik | VTI arayüz sayaçları | T |
| Yedek ve veri seti hacmi | Yedekleme yazılımı raporu; Ar-Ge veri envanteri | Bulk pencere hesabı |
| Yurt/akşam profili | Saat bazlı kullanım eğrisi (hafta içi / hafta sonu) | S1–S3 seçimi |
| Cihaz/kişi oranı | NAC/DHCP istatistikleri | N (cihaz bazlı limit için) |

## 8. Kapasite yükseltme kriterleri (Ö)

1. Yoğun saat 95. yüzdelik kullanım **3 ardışık ay %70'i** aşarsa → bir kademe yükseltme planı.
2. Tek bir günde **%90+** doluluk ve kullanıcı şikâyeti → acil gözden geçirme (politika mi, kapasite mi?).
3. Yeni yük (yurt açılması, hibrit eğitim, Ar-Ge veri projesi) → senaryo yeniden hesaplanır.
4. Yedeklilik: yedek devre düştüğünde kalan devre tepe talebi %100 altında taşıyamıyorsa → kapasite veya mimari değişikliği.
5. Yıllık gözden geçirme: g katsayısı ölçülen büyümeyle güncellenir.

## 9. Varsayım ve açık soru özeti

- Kullanılan varsayımlar: F-02; V-02..V-04 (konumlar), V-06 (sayılar), V-07, V-08 (S2 taban), V-13 (lab ölçeği), V-14 (hub).
- Araştırma kalemleri: A-01, A-02, A-03, A-04 (yükseköğretim kıyası **bulunamadı**), A-09 (Ar-Ge veri hacmi), yedek hacmi (yeni: A-13).
- Öğretim görevlisi soruları: Q-02, Q-03, Q-08, Q-09.


---

# Güvenlik duvarı politika matrisi


**Amaç:** Zone'lar arası izinli akışları kural düzeyinde (kaynak, hedef, servis, eylem, log, gerekçe) tanımlamak. Uygulamada her satır bir veya birkaç firewall kuralına dönüşür; kural açıklama alanı bu satırın ID'sini taşır (FR-10, NFR-19).
Zone tanımları: `architecture/vlan-and-security-zones.md`. Adresler: `architecture/proposed-ip-plan.md`.
**Tarih:** 2026-10-23 · **Durum:** Hiçbir kural uygulanmadı.

## 1. Genel ilkeler

1. **Varsayılan reddet** her arayüzde (pfSense/OPNsense davranışı, S-13). Yalnızca aşağıdaki satırlar izin verir.
2. Kurallar **alias** ile yazılır: `ZONE_<ad>` (ağ alias'ı, tüm sitelerdeki aynı zone alt ağlarını içerir), `SVC_<ad>` (port alias'ı), `HOST_<ad>` (belirli sunucular).
3. **Zone'lar site-bağımsızdır:** İstanbul SW-DEV → Ankara SERVER, satır P-30 ile değerlendirilir; VTI arayüzünde aynı alias'lar kullanılır.
4. Reddedilen zone'lar arası trafik **loglanır** (P-99). Arayüz varsayılan deny'ı broadcast gürültüsü nedeniyle loglanmaz; bunun yerine son kural olarak açık "reject/block + log" eklenir.
5. Sunucu zone'larından **dışa bağlantı başlatma** sınırlıdır (P-60..62).
6. pfSense'te kural **arayüz girişinde** değerlendirilir (S-13'teki OPNsense modeli aynı): "STUDENT → SERVER" kuralı STUDENT arayüzüne yazılır.

## 2. Servis alias'ları (öneri)

| Alias | Portlar |
|---|---|
| SVC_WEB | TCP 80, 443 |
| SVC_DNS | UDP/TCP 53 |
| SVC_NTP | UDP 123 |
| SVC_DHCP | UDP 67, 68 (arayüz yerel; kural genelde otomatik) |
| SVC_MAIL_CLIENT | TCP 587, 993 (bulut e-posta için WAN) |
| SVC_FILE | TCP 445 (SMB), 2049 (NFS, ops.) |
| SVC_PRINT | TCP 9100, 631 |
| SVC_GIT | TCP 22, 443 |
| SVC_MGMT | TCP 443 (GUI), 22 (SSH) |
| SVC_SYSLOG | UDP/TCP 514, TCP 6514 (TLS) |
| SVC_RADIUS | UDP 1812, 1813 |
| SVC_IPSEC | UDP 500, 4500 + ESP |
| SVC_OPENVPN | UDP 1194 |
| SVC_CONF | UDP 3478–3481, TCP 443 (konferans; Ö) |
| SVC_RDP_SSH | TCP 3389, 22 |
| SVC_LDAP | TCP 636 |
| SVC_P2P_BLOCK | TCP/UDP 6881–6889, 6969 (Ö; eksik liste) |

## 3. Politika matrisi

Eylem: **İZİN** / **RED** · Log: E/H · QoS: `policies/bandwidth-policy.md` sınıfı

### 3.1 GUEST (VLAN 70)

| ID | Kaynak | Hedef | Servis | Eylem | Log | QoS | Gerekçe |
|---|---|---|---|---|---|---|---|
| P-01 | ZONE_GUEST | Firewall Guest IP | SVC_DNS, SVC_DHCP | İZİN | H | BW-01 | Yalnızca firewall DNS'i |
| P-02 | ZONE_GUEST | RFC1918_ALL (10/8, 172.16/12, 192.168/16) | any | **RED** | E | — | İç ağ koruması (FR-05) |
| P-03 | ZONE_GUEST | WAN (any) | SVC_WEB | İZİN | H | BW-07 | İnternet-only |
| P-04 | ZONE_GUEST | any | any | RED | E | — | Son kural |

### 3.2 STUDENT (VLAN 50/51x) ve LAB (VLAN 60)

| ID | Kaynak | Hedef | Servis | Eylem | Log | QoS | Gerekçe |
|---|---|---|---|---|---|---|---|
| P-10 | ZONE_STUDENT, ZONE_LAB | Firewall arayüz IP | SVC_DNS, SVC_NTP, SVC_DHCP | İZİN | H | BW-01 | Temel servisler |
| P-11 | ZONE_STUDENT, ZONE_LAB | HOST_LMS, HOST_LIBRARY, HOST_SIS_STUDENT_PORTAL | SVC_WEB | İZİN | H | BW-03 | Akademik servisler (FR-04) |
| P-12 | ZONE_STUDENT, ZONE_LAB | HOST_PRINT_STUDENT | SVC_PRINT | İZİN | H | BW-04 | Kütüphane yazdırma |
| P-13 | ZONE_LAB | HOST_IMAGE_LICENSE | PXE/TFTP, SMB, lisans portları (Ö) | İZİN | H | BW-06 | Lab imaj/lisans (FR-06) |
| P-14 | ZONE_STUDENT, ZONE_LAB | ZONE_DMZ | SVC_WEB | İZİN | H | BW-03 | Yayınlanan servisler |
| P-15 | ZONE_STUDENT, ZONE_LAB | ZONE_ADMIN, ZONE_MGMT, ZONE_ITOPS, ZONE_SERVER (P-11..13 dışı), ZONE_STAFF, ZONE_RND, ZONE_SWDEV, ZONE_CI | any | **RED** | E | — | İzolasyon (FR-03) |
| P-16 | ZONE_STUDENT, ZONE_LAB | WAN | SVC_P2P_BLOCK | RED | E | BW-08 | Politika |
| P-17 | ZONE_STUDENT, ZONE_LAB | WAN | any | İZİN | H | BW-04 (per-IP limiter) | İnternet |
| P-18 | ZONE_STUDENT ↔ ZONE_LAB | — | any | RED | E | — | Öğrenci cihazı lab makinesine erişmez |

### 3.3 STAFF (VLAN 40)

| ID | Kaynak | Hedef | Servis | Eylem | Log | QoS | Gerekçe |
|---|---|---|---|---|---|---|---|
| P-20 | ZONE_STAFF | Firewall IP | SVC_DNS, SVC_NTP, SVC_DHCP | İZİN | H | BW-01 | — |
| P-21 | ZONE_STAFF | HOST_LMS, HOST_LIBRARY, HOST_FILE, HOST_PRINT, HOST_INTRANET | SVC_WEB, SVC_FILE, SVC_PRINT | İZİN | H | BW-03 | İş servisleri |
| P-22 | ZONE_STAFF (öğretim elemanı alias'ı) | ZONE_LAB | SVC_RDP_SSH | İZİN | E | BW-03 | Lab yönetimi (ops.) |
| P-23 | ZONE_STAFF | ZONE_ADMIN, ZONE_MGMT, ZONE_ITOPS, ZONE_RND, ZONE_SWDEV, ZONE_CI, ZONE_STUDENT, ZONE_GUEST | any | RED | E | — | İzolasyon |
| P-24 | ZONE_STAFF | WAN | any | İZİN | H | BW-03 | İnternet |

### 3.4 ADMIN (VLAN 30)

| ID | Kaynak | Hedef | Servis | Eylem | Log | QoS | Gerekçe |
|---|---|---|---|---|---|---|---|
| P-25 | ZONE_ADMIN | Firewall IP | SVC_DNS, SVC_NTP, SVC_DHCP | İZİN | H | BW-01 | — |
| P-26 | ZONE_ADMIN | HOST_SIS_ADMIN, HOST_HR, HOST_ERP, HOST_FILE, HOST_PRINT | SVC_WEB, SVC_FILE, SVC_PRINT | İZİN | **E** | BW-03 | Hassas uygulamalar → erişim loglanır |
| P-27 | ZONE_ADMIN | Diğer tüm iç zone'lar | any | RED | E | — | — |
| P-28 | ZONE_ADMIN | WAN | SVC_WEB, SVC_MAIL_CLIENT, SVC_CONF | İZİN | H | BW-02/03 | İnternet (daraltılmış) |

### 3.5 SOFTWARE-DEV (80) ve CI-BUILD (81)

| ID | Kaynak | Hedef | Servis | Eylem | Log | QoS | Gerekçe |
|---|---|---|---|---|---|---|---|
| P-30 | ZONE_SWDEV | HOST_GIT, HOST_ARTIFACT, HOST_REGISTRY, HOST_CI | SVC_GIT, SVC_WEB | İZİN | H | BW-05 | Geliştirme (FR-07) |
| P-31 | ZONE_SWDEV | ZONE_CI | SVC_WEB, SVC_RDP_SSH | İZİN | H | BW-05 | Test ortamı erişimi |
| P-32 | ZONE_SWDEV | WAN | any (SVC_P2P_BLOCK hariç) | İZİN | H | BW-05 | Geniş internet |
| P-33 | ZONE_SWDEV | ZONE_ADMIN, ZONE_STAFF, ZONE_MGMT, ZONE_ITOPS, ZONE_RND, ZONE_STUDENT, ZONE_LAB, ZONE_GUEST | any | RED | E | — | İzolasyon |
| P-34 | ZONE_CI | HOST_GIT, HOST_ARTIFACT, HOST_REGISTRY | SVC_GIT, SVC_WEB | İZİN | H | BW-06 | Build |
| P-35 | ZONE_CI | HOST_PROXY (veya WAN allow-list alias) | SVC_WEB | İZİN | E | BW-06 | Dış bağımlılık, loglu |
| P-36 | ZONE_CI | ZONE_DMZ (staging host alias) | SSH/HTTPS | İZİN | E | BW-06 | Deploy |
| P-37 | ZONE_CI | any | any | RED | E | — | Son kural (kullanıcı zone'ları dahil) |

### 3.6 RND (90)

| ID | Kaynak | Hedef | Servis | Eylem | Log | QoS | Gerekçe |
|---|---|---|---|---|---|---|---|
| P-40 | ZONE_RND | Firewall IP | SVC_DNS, SVC_NTP, SVC_DHCP | İZİN | H | BW-01 | — |
| P-41 | ZONE_RND | HOST_GIT (İstanbul, VPN), HOST_RND_STORAGE, HOST_BACKUP | SVC_GIT, SVC_FILE | İZİN | H | BW-05/06 | Kod ve veri |
| P-42 | ZONE_RND | WAN_ALLOWLIST (veri kaynakları, yayınlar) **veya** HOST_PROXY | SVC_WEB | İZİN | **E** | BW-06 | Kısıtlı internet, loglu (fikri mülkiyet) |
| P-43 | ZONE_RND | any | any | RED | E | — | — |
| P-44 | Diğer tüm zone'lar | ZONE_RND | any | RED | E | — | İçeri erişim yok (IT-OPS hariç P-71) |

### 3.7 SERVER (20) ve DMZ (25)

| ID | Kaynak | Hedef | Servis | Eylem | Log | QoS | Gerekçe |
|---|---|---|---|---|---|---|---|
| P-60 | ZONE_SERVER | HOST_SYSLOG (MGMT/SERVER-ANK), HOST_NTP, HOST_DNS_AUTH | SVC_SYSLOG, SVC_NTP, SVC_DNS | İZİN | H | BW-01 | Altyapı |
| P-61 | ZONE_SERVER | WAN (güncelleme depoları alias'ı / HOST_PROXY) | SVC_WEB | İZİN | E | BW-06 | Güncellemeler |
| P-62 | ZONE_SERVER | Kullanıcı zone'ları (ADMIN, STAFF, STUDENT, LAB, GUEST, SWDEV, RND) | any | RED | E | — | Sunucu bağlantı başlatmaz |
| P-63 | WAN | ZONE_DMZ (HOST_PUBLIC_WEB) | TCP 443 | İZİN (port forward/1:1) | E | BW-03 | Yayın (FR-14) |
| P-64 | ZONE_DMZ | HOST_APP_BACKEND (SERVER) | Uygulama portu (Ö: 5432/8443) | İZİN | E | BW-03 | Arka uç |
| P-65 | ZONE_DMZ | any | any | RED | E | — | — |

### 3.8 IT-OPS (200) ve MGMT (10)

| ID | Kaynak | Hedef | Servis | Eylem | Log | QoS | Gerekçe |
|---|---|---|---|---|---|---|---|
| P-70 | ZONE_ITOPS, VPN_ITOPS (10.255.100.0/24) | ZONE_MGMT (tüm siteler) | SVC_MGMT, SNMP (UDP 161), ICMP | İZİN | **E** | BW-01 | Yönetim (FR-08) — tüm oturumlar loglanır |
| P-71 | ZONE_ITOPS | Tüm iç zone'lar | ICMP, SVC_RDP_SSH, SVC_MGMT | İZİN | E | BW-03 | Destek/sorun giderme; dar ve loglu |
| P-72 | ZONE_ITOPS | WAN | any | İZİN | H | BW-03 | — |
| P-73 | ZONE_MGMT | HOST_NTP, HOST_SYSLOG, HOST_DNS, güncelleme alias'ı | SVC_NTP, SVC_SYSLOG, SVC_DNS, SVC_WEB | İZİN | H | BW-01 | Cihazların gereksinimi |
| P-74 | ZONE_MGMT | any (P-73 dışı) | any | RED | E | — | Yönetim düzlemi dışa konuşmaz |
| P-75 | Tüm zone'lar (ITOPS/VPN_ITOPS hariç) | ZONE_MGMT, Firewall yönetim portları | any | **RED** | **E** | — | Yönetim koruması (FR-29); anti-lockout yalnızca MGMT arayüzünde |

### 3.9 WAN ve VPN

| ID | Kaynak | Hedef | Servis | Eylem | Log | Gerekçe |
|---|---|---|---|---|---|---|
| P-80 | HOST_VPN_PEERS (diğer sitelerin WAN IP'leri) | WAN IP | SVC_IPSEC | İZİN | E | Site-to-site (FR-13, FR-15) |
| P-81 | any | WAN IP | SVC_OPENVPN / SVC_IPSEC (remote-access) | İZİN | E | Remote-access (yalnızca hub) |
| P-82 | WAN | any (P-63, P-80, P-81 dışı) | any | RED | H (gürültü) | Varsayılan; bogon/özel adres engeli açık |
| P-83 | VTI (TRANSIT) arayüzü | — | — | Zone alias'larına göre yukarıdaki tüm satırlar aynen uygulanır; **"any-any" yok** | E (red) | FR-12, FR-16 |
| P-84 | VPN_STAFF (10.255.101.0/24) | STAFF satırları (P-20..24) ile aynı | — | — | — | Rol = zone (FR-19) |
| P-85 | VPN_DEV (10.255.102.0/24) | SW-DEV satırları (P-30..33) ile aynı | — | — | — | Rol = zone |

### 3.10 Son kural (her arayüz)

| ID | Kaynak | Hedef | Servis | Eylem | Log |
|---|---|---|---|---|---|
| P-99 | Arayüz ağı | any | any | RED | **E** (FR-09) |

## 4. NAT politikası

| ID | Kural | Not |
|---|---|---|
| N-01 | Outbound NAT: her sitede yerel RFC1918 → WAN IP (otomatik/hybrid) | FR-11 |
| N-02 | **NAT istisnası:** hedef 10.0.0.0/8 (VPN) için NAT **yok** | FR-12 |
| N-03 | Port forward: WAN:443 → HOST_PUBLIC_WEB (DMZ) — opsiyonel | FR-14 |
| N-04 | Guest için ayrı WAN IP (varsa) — ops. | Kötüye kullanım şikâyetlerinde izolasyon |

## 5. Gözden geçirme kontrol listesi (uygulama öncesi)

- [ ] Her satırın bir FR veya gerekçesi var
- [ ] Hiçbir satırda "any → any İZİN" yok (P-17/P-24/P-32 WAN'a; iç zone'lara değil)
- [ ] Reddedilenler loglanıyor (P-99)
- [ ] Alias'lar tüm sitelerin alt ağlarını içeriyor (VTI trafiği için)
- [ ] NAT istisnası N-02 var (yoksa VPN üzerinden kaynak IP değişir, zone kuralları bozulur)


---

# VLAN ve güvenlik bölgeleri


**Amaç:** Akademik birim ve ofisler için **kavramsal** güvenlik bölgelerini, aralarındaki iletişim ilkelerini ve izole edilmesi gerekenleri tanımlamak. Bölgeler **önerilen mantıksal segmentlerdir**, onaylanmış fiziksel ağlar değildir.
VLAN ID ve adresler: `proposed-ip-plan.md` (tek kaynak). Kural düzeyinde ayrıntı: `policies/firewall-policy-matrix.md`.
**Tarih:** 2026-10-23

## 1. Zone listesi (tüm belgelerde bu adlar kullanılır)

| Zone | VLAN | Güven düzeyi (1 düşük – 5 yüksek) | Kimler / neler | Temel ilke |
|---|---|---|---|---|
| **WAN** | — | 0 | İnternet | Her şey reddedilir; yalnızca VPN ve yayınlanan servisler |
| **GUEST** | 70 | 1 | Ziyaretçi cihazları, captive portal | İnternet-only; iç ağa ve diğer misafirlere erişim yok |
| **STUDENT** (WIRED 50 / WIFI 51) | 50, 51 | 2 | Öğrenci cihazları (BYOD) | İnternet + yalnızca belirlenen akademik servisler; per-IP limit |
| **LAB** | 60 | 2 | Laboratuvar/bilgisayar sınıfı makineleri (kurum cihazı, ancak öğrenci kullanır, zafiyet riski yüksek) | STUDENT'a benzer; ek olarak imaj/lisans sunucuları; lab'lar arası izolasyon seçeneği |
| **STAFF** | 40 | 3 | Akademik personel, ofis personeli | Server servislerine geniş erişim; Admin'e yok |
| **ADMIN** | 30 | 4 | İdari personel (İK, finans, öğrenci işleri) | Hassas uygulamalar (ÖBS, İK); yalnızca gerekli hedefler |
| **SOFTWARE-DEV** | 80 | 3 | Geliştirici istasyonları | Git/artefakt/CI'ya tam; Admin'e yok; internet geniş (paket indirme) |
| **CI-BUILD** | 81 | 2 | Build ajanları, test VM'leri (otomasyon, kod çalıştırır → riskli) | Yalnızca Git/artefakt/registry ve internet (proxy ile); kullanıcı zone'larına yok |
| **RND** | 90 | 3 | Ar-Ge istasyonları ve hesaplama düğümleri | İzole; Server ortak servisleri; internet kısıtlı/allow-list (fikri mülkiyet) |
| **SERVER** | 20 | 4 | DNS, DHCP, LMS, ÖBS, Git, artefakt, syslog, dosya | Yalnızca servis portları; sunucudan dışa çıkış kısıtlı |
| **DMZ** | 25 | 2 | Dışa açık web/LMS ön yüzü (opsiyonel) | WAN'dan yalnızca 443; DMZ → SERVER yalnızca uygulama arka ucu |
| **IT-OPS** | 200 | 4 | BT/ağ operasyon personeli istasyonları | MGMT'ye tek giriş noktası; jump host |
| **MGMT** | 10 | 5 | Cihaz yönetim arayüzleri (firewall GUI/SSH, anahtar, AP denetleyici, hipervizör, syslog alıcı) | Yalnızca IT-OPS ve VPN-ITOPS'tan; dışa çıkış yalnızca NTP/güncelleme |
| **VPN-RA** | — | rolüne göre | Remote-access istemcileri (10.255.100.0/22; rol bazlı /24'ler) | Rolün zone'u ile aynı kurallar |
| **TRANSIT** | 99 | — | Siteler arası VTI | Yalnızca yönlendirme; kullanıcı yok |

**Güven düzeyi** bir kural değil, kural yazarken yön sezgisidir: trafik düşük güvenden yüksek güvene **varsayılan reddedilir**, yüksekten düşüğe bile **açık izin ister** (ör. ADMIN → STUDENT için meşru akış yoktur).

## 2. İletişim ilkeleri (özet matris)

✅ izinli (belirli servislerle) · ◑ kısıtlı/koşullu · ❌ reddedilir · — aynı zone

| Kaynak ↓ / Hedef → | WAN | GUEST | STUDENT | LAB | STAFF | ADMIN | SW-DEV | CI | RND | SERVER | DMZ | IT-OPS | MGMT |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **GUEST** | ✅ (DNS/HTTP/S) | — (client isolation) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **STUDENT** | ✅ (limitli) | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◑ (LMS/ÖBS-öğrenci/DNS/NTP/print) | ✅ (443) | ❌ | ❌ |
| **LAB** | ✅ (limitli) | ❌ | ❌ | — (lab içi; lab'lar arası ❌ ops.) | ❌ | ❌ | ❌ | ❌ | ❌ | ◑ (LMS, imaj/lisans sunucusu, DNS) | ✅ | ❌ | ❌ |
| **STAFF** | ✅ | ❌ | ❌ | ◑ (öğretim elemanı → lab yönetimi, RDP/SSH ops.) | — | ❌ | ❌ | ❌ | ❌ | ✅ (LMS, dosya, e-posta, DNS, print) | ✅ | ❌ | ❌ |
| **ADMIN** | ✅ | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ✅ (ÖBS, İK, finans, dosya, DNS) | ✅ | ❌ | ❌ |
| **SW-DEV** | ✅ (geniş) | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ (CI tetikleme, test ortamı erişimi) | ❌ | ✅ (Git, artefakt, registry, DNS) | ◑ (staging) | ❌ | ❌ |
| **CI** | ◑ (proxy/allow-list) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ | ◑ (Git, artefakt, registry) | ◑ (deploy) | ❌ | ❌ |
| **RND** | ◑ (allow-list/proxy) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ◑ (Git, veri deposu, DNS) | ❌ | ❌ | ❌ |
| **SERVER** | ◑ (güncelleme, NTP, dış API) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — (servis bazlı) | ◑ (yanıt/arka uç) | ❌ | ◑ (syslog → MGMT syslog alıcı) |
| **DMZ** | ◑ (yalnızca gerekli) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◑ (yalnızca uygulama arka ucu) | — | ❌ | ❌ |
| **IT-OPS** | ✅ | ❌ | ◑ (sorun giderme: ICMP) | ◑ | ◑ | ◑ | ◑ | ◑ | ◑ | ✅ (yönetim portları) | ✅ | — | ✅ (HTTPS/SSH) |
| **MGMT** | ◑ (NTP, güncelleme, DNS) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◑ (syslog, NTP, LDAP) | ❌ | ❌ | — |
| **WAN** | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◑ (443 yayın) | ❌ | ❌ (VPN hariç) |

**Tüm siteler arası (VPN üzerinden) trafik** aynı zone matrisine tabidir: İstanbul SW-DEV → Ankara SERVER, "SW-DEV → SERVER" satırıyla değerlendirilir. Zone'lar site-bağımsızdır.

## 3. İzolasyon gerekçeleri (özet)

| İzolasyon | Neden |
|---|---|
| STUDENT ↔ ADMIN | Öğrenci cihazı yönetilmez (BYOD); idari sistemlerde kişisel ve finansal veri. En yaygın kampüs saldırı yüzeyi |
| GUEST ↔ her şey | Kimliği doğrulanmamış cihazlar |
| LAB ↔ STAFF/ADMIN | Lab makineleri paylaşımlı, sık sık zafiyetli yazılım çalıştırır |
| CI ↔ kullanıcı zone'ları | CI, dışarıdan gelen kodu çalıştırır (tedarik zinciri riski) |
| RND → WAN kısıtlı | Fikri mülkiyet; veri sızıntısı |
| MGMT ↔ her şey (IT-OPS hariç) | Yönetim düzlemi ele geçirilmesi = tüm ağın ele geçirilmesi |
| SERVER → kullanıcı zone'ları ❌ | Sunucular bağlantı başlatmaz; ele geçirilmiş sunucudan yatay hareketi kısıtlar |

## 4. Ofisler için güvenlik sınırları (Ankara, İstanbul, Londra)

### 4.1 Ortak model (her ofis)

```
İnternet ──[WAN]── Firewall (default deny) ──┬── MGMT (10)
                         │                    ├── SERVER (20)
                      [IPsec VTI]             ├── ADMIN (30)
                         │                    ├── STAFF (40)
                      Diğer siteler           ├── GUEST (70)
                                              └── site-özel zone'lar
```

### 4.2 Site farkları (V)

| Site | Ek zone'lar | Özel sınırlar |
|---|---|---|
| **Ankara** | IT-OPS (200), DMZ (25, ops.), VOICE | VPN hub: tüm spoke'lardan gelen trafik önce Ankara firewall'unda zone kurallarına tabi; merkezi syslog/NTP/kimlik SERVER'da; IT-OPS → tüm sitelerin MGMT'sine (VPN üzerinden) tek izinli kaynak |
| **İstanbul** | SOFTWARE-DEV (80), CI-BUILD (81) | CI çıkışı proxy/allow-list; staging erişimi yalnızca SW-DEV; yerel Git/artefakt sunucusu SERVER'da; Ankara'daki merkezi servislere VPN |
| **Londra** | Yok (küçük ofis) | Yerel internet çıkışı; **TR'ye yalnızca gerekli uygulama akışları** (yasal sınır notu A-10); yerel MGMT'ye Ankara IT-OPS erişimi VPN üzerinden ve loglu; yerel teknik personel yoksa "lights-out" yönetim (konsol/IPMI ops.) |

### 4.3 Akademik yerleşke farkları

- En fazla zone (STUDENT-WIRED/WIFI, LAB, RND, DMZ).
- STUDENT-WIFI bina başına alt VLAN'lara bölünür; hepsi aynı zone kurallarını alır (alias ile).
- Captive portal / 802.1X (Q-09) zone'un uygulama noktasıdır.
- En yüksek WAN kapasitesi ve per-IP limiter yükü → üretimde ayrı/daha güçlü firewall, lab'da aynı pfSense.

## 5. Lab'da gösterim

Lab'da her zone en az bir Alpine Linux istemciyle temsil edilir (en az: STUDENT, STAFF, ADMIN, GUEST, SERVER, MGMT/IT-OPS; kaynak varsa LAB, SW-DEV, RND). Testler `validation/test-plan.md` T-S1..S3, T-G1, T-M1.


---

# IP planı


> **Durum: ÖNERİ.** Hiçbir cihaza uygulanmamıştır. Alt ağ boyutları V-06/V-07 varsayımlarına dayanır; gerçek sayılar geldiğinde yeniden boyutlandırılır. Bu belge VLAN ve adres bilgisi için **tek kaynaktır**; diğer belgeler buraya atıf yapar.
> **Tarih:** 2026-10-23 · Kaynaklar: RFC 1918 (S-30), RFC 4193 (S-31, genel bilgi), RFC 5737 (TEST-NET blokları, genel bilgi)

## 1. Tasarım ilkeleri

1. **Tek özel blok:** Tüm organizasyon 10.0.0.0/8 (RFC 1918, S-30) içinde. 172.16/12 ve 192.168/16 **kullanılmaz**; böylece ev/misafir ağlarıyla ve VPN istemcilerinin yerel ağlarıyla çakışma riski azalır (192.168.x.x ev yönlendiricilerinde yaygındır).
2. **Site = ikinci oktet:** 10.`<site>`.0.0/16. Siteler arası özetleme (summarization) tek route ile yapılır; çakışma imkânsızdır.
3. **VLAN ID = üçüncü oktet** (küçük zone'lar için): 10.`<site>`.`<vlan>`.0/24 → adres görünce VLAN ve site okunur. Büyük zone'lar (öğrenci Wi-Fi) ayrı /16'dan tahsis edilir.
4. **Aynı VLAN ID her sitede aynı anlam** (NFR-16).
5. **Büyüme payı:** Her sitede /16'nın büyük kısmı boş; 10.50–10.250 arası yeni siteler için ayrılmıştır (NFR-15).
6. **Transit ve VPN** adresleri 10.255.0.0/16 içinde; hiçbir kullanıcı alt ağıyla karışmaz.
7. **Gateway kuralı:** Her alt ağda `.1` firewall (CARP varsa `.1` VIP, `.2`/`.3` düğümler — S-06 subnet başına 3 IP); DHCP havuzu `.100`–`.250` (Ö); `.2`–`.99` statik/rezerve.

## 2. Site blokları

| Site | Blok | Kullanılabilir /24 | Not |
|---|---|---|---|
| Ankara (HQ, hub) | **10.10.0.0/16** | 256 | V-01 |
| İstanbul | **10.20.0.0/16** | 256 | V-03 |
| Londra | **10.30.0.0/16** | 256 | V-05 |
| Akademik Yerleşke | **10.40.0.0/14** (10.40–10.43) | 1024 | 10.000 öğrenci × 2 cihaz (V-07) için geniş havuz |
| Rezerve (gelecek siteler) | 10.50.0.0 – 10.250.255.255 | — | — |
| Transit / VPN / loopback | **10.255.0.0/16** | — | §5 |

## 3. VLAN ve zone şeması (tüm siteler için ortak)

| VLAN ID | Zone adı | Üçüncü oktet | Varsayılan boyut | Uygulandığı siteler | Not |
|---|---|---|---|---|---|
| 10 | **MGMT** (ağ yönetimi) | .10 | /24 | Tümü | Firewall, anahtar, AP, hipervizör yönetim IP'leri; DHCP yok |
| 20 | **SERVER** (sunucu ve altyapı) | .20 | /24 | Tümü (Londra'da küçük) | DNS, DHCP, Git, artefakt, LMS vb.; statik |
| 25 | **DMZ** (dışa açık servisler) | .25 | /24 | Ankara, Akademik (opsiyonel) | FR-14 |
| 30 | **ADMIN** (idari personel) | .30 | /24 | Tümü | İK, finans, öğrenci işleri |
| 40 | **STAFF** (akademik/ofis personeli) | .40 | /24 (Akademik: /22) | Tümü | Kablolu + personel Wi-Fi |
| 50 | **STUDENT-WIRED** (sınıf/kütüphane kablolu) | .50 | /24 (Akademik: /22) | Akademik | — |
| 51 | **STUDENT-WIFI** | özel blok | Akademik: 10.41.0.0/16 | Akademik | §4.4 |
| 60 | **LAB** (laboratuvar) | .60 | /22 | Akademik | Lab başına /24 alt bölümleme olası |
| 70 | **GUEST** | .70 | /24 (Akademik: /21) | Tümü | İnternet-only, client isolation |
| 80 | **SOFTWARE-DEV** | .80 | /24 | İstanbul (V-03) | Geliştirici istasyonları |
| 81 | **CI-BUILD** | .81 | /24 | İstanbul | Build ajanları, test ortamları |
| 90 | **RND** (Ar-Ge) | .90 | /24 | Akademik (V-04) | Hesaplama düğümleri dahil |
| 100 | **VOICE** (opsiyonel) | .100 | /24 | Tümü | VoIP; QoS sınıfı |
| 200 | **IT-OPS** (BT/ağ operasyon istasyonları) | .200 | /24 | Ankara (V-02); diğer sitelerde yerel teknik personel varsa | MGMT'den ayrı; MGMT'ye tek izinli kaynak |
| 99 | **TRANSIT** | 10.255.x | /30 | Tümü | VTI tünel uçları (§5) |

## 4. Site başına alt ağ tahsisi

### 4.1 Ankara — 10.10.0.0/16 (V-06: 150 personel + IT-Ops 15 → ~250 cihaz)

| Alt ağ | VLAN | Zone | Gateway | DHCP |
|---|---|---|---|---|
| 10.10.10.0/24 | 10 | MGMT | 10.10.10.1 | Yok |
| 10.10.20.0/24 | 20 | SERVER (merkezi: AD/LDAP?, DNS, syslog, yedek) | 10.10.20.1 | Yok |
| 10.10.25.0/24 | 25 | DMZ (opsiyonel) | 10.10.25.1 | Yok |
| 10.10.30.0/24 | 30 | ADMIN | 10.10.30.1 | .100–.250 |
| 10.10.40.0/24 | 40 | STAFF | 10.10.40.1 | .100–.250 |
| 10.10.70.0/24 | 70 | GUEST | 10.10.70.1 | .100–.250 |
| 10.10.100.0/24 | 100 | VOICE (ops.) | 10.10.100.1 | .100–.250 |
| 10.10.200.0/24 | — | IT-OPS (yönetici istasyonları; MGMT'den ayrı!) | 10.10.200.1 | Rezerve |

> IT-Ops personel bilgisayarları MGMT'de **değil**, ayrı IT-OPS zone'undadır (VLAN 200); MGMT yalnızca cihaz yönetim arayüzleri içindir. Bu, "yönetici bilgisayarı ele geçirilirse" senaryosunda tek atlama yerine kural denetimi sağlar.

### 4.2 İstanbul — 10.20.0.0/16 (V-06: 100 personel + 60 yazılım)

| Alt ağ | VLAN | Zone | Gateway | DHCP |
|---|---|---|---|---|
| 10.20.10.0/24 | 10 | MGMT | 10.20.10.1 | Yok |
| 10.20.20.0/24 | 20 | SERVER (Git, artefakt deposu, container registry, yerel DNS) | 10.20.20.1 | Yok |
| 10.20.30.0/24 | 30 | ADMIN | 10.20.30.1 | .100–.250 |
| 10.20.40.0/24 | 40 | STAFF | 10.20.40.1 | .100–.250 |
| 10.20.70.0/24 | 70 | GUEST | 10.20.70.1 | .100–.250 |
| 10.20.80.0/24 | 80 | SOFTWARE-DEV | 10.20.80.1 | .100–.250 |
| 10.20.81.0/24 | 81 | CI-BUILD | 10.20.81.1 | .100–.250 |
| 10.20.100.0/24 | 100 | VOICE (ops.) | 10.20.100.1 | .100–.250 |

### 4.3 Londra — 10.30.0.0/16 (V-06: 30 personel)

| Alt ağ | VLAN | Zone | Gateway | DHCP |
|---|---|---|---|---|
| 10.30.10.0/24 | 10 | MGMT | 10.30.10.1 | Yok |
| 10.30.20.0/24 | 20 | SERVER (yerel DNS/DHCP, dosya önbelleği) | 10.30.20.1 | Yok |
| 10.30.30.0/24 | 30 | ADMIN | 10.30.30.1 | .100–.250 |
| 10.30.40.0/24 | 40 | STAFF | 10.30.40.1 | .100–.250 |
| 10.30.70.0/24 | 70 | GUEST | 10.30.70.1 | .100–.250 |

### 4.4 Akademik Yerleşke — 10.40.0.0/14

| Alt ağ | VLAN | Zone | Gateway | Boyut gerekçesi (V/Ö) |
|---|---|---|---|---|
| 10.40.10.0/24 | 10 | MGMT | 10.40.10.1 | ~100 AP + anahtar + sunucu yönetimi (Ö) |
| 10.40.20.0/24 | 20 | SERVER (LMS, ÖBS, kütüphane, DNS, DHCP, syslog) | 10.40.20.1 | Statik |
| 10.40.25.0/24 | 25 | DMZ (web/LMS dış erişim, opsiyonel) | 10.40.25.1 | — |
| 10.40.30.0/24 | 30 | ADMIN (300 idari × 1,5 = 450 cihaz → /23 gerekir!) | 10.40.30.1 | **/23 → 10.40.30.0/23** olarak büyütülür |
| 10.40.40.0/22 | 40 | STAFF (600 akademik × 1,5 = 900 → /22 = 1022) | 10.40.40.1 | /22 |
| 10.40.50.0/22 | 50 | STUDENT-WIRED (sınıflar, kütüphane) | 10.40.50.1 | ~800 kablolu nokta (Ö) |
| **10.41.0.0/16** | 51 | STUDENT-WIFI | 10.41.0.1 (veya bina başına /20 alt havuzlar) | 10.000 × 2 cihaz × eşzamanlı kira payı; **tek /16 broadcast alanı önerilmez** → uygulamada bina/AP grubu başına /20 (4094 adres) alt VLAN'lar (51x) |
| 10.40.60.0/22 | 60 | LAB (laboratuvarlar; lab başına /24) | 10.40.60.1 | 4 lab × 250 |
| 10.40.70.0/21 | 70 | GUEST | 10.40.70.1 | 2000 eşzamanlı misafir (Ö), kısa DHCP kirası |
| 10.40.90.0/24 | 90 | RND | 10.40.90.1 | 40 kişi + hesaplama düğümleri |
| 10.40.100.0/24 | 100 | VOICE (ops.) | 10.40.100.1 | — |
| 10.42.0.0/16, 10.43.0.0/16 | — | Rezerve (ek yurt/bina blokları, IoT, kamera) | — | Büyüme |

> **Not — Student Wi-Fi tasarımı (V):** DHCP kira süresi kısa (1–2 saat) tutulursa aynı anda aktif cihaz sayısı toplam cihazdan çok küçüktür; ancak /16'lık tek L2 alanı ARP/broadcast yükü nedeniyle gerçek ağda uygun değildir. Lab'da tek /20 ile temsil edilir.

## 5. Transit, VPN ve loopback — 10.255.0.0/16

| Alt ağ | Kullanım |
|---|---|
| 10.255.0.0/30 | VTI: Ankara (10.255.0.1) ↔ İstanbul (10.255.0.2) |
| 10.255.0.4/30 | VTI: Ankara (.5) ↔ Londra (.6) |
| 10.255.0.8/30 | VTI: Ankara (.9) ↔ Akademik (.10) |
| 10.255.0.12/30 – 10.255.0.252/30 | Rezerve (full-mesh'e geçiş: İstanbul↔Londra, İstanbul↔Akademik, Londra↔Akademik) |
| 10.255.100.0/22 | Remote-access VPN istemci havuzu (rol bazlı alt bölümleme: .100.0/24 IT-Ops, .101.0/24 Staff, .102.0/24 Dev) |
| 10.255.254.0/24 | CARP pfsync/HA senkron ağı (sitede HA varsa; S-06: ayrı kullanılmayan subnet) |
| 10.255.255.0/24 | Loopback / router-ID |

## 6. Lab WAN simülasyonu (yalnızca lab)

Gerçek genel IP yerine RFC 5737 dokümantasyon blokları (genel bilgi; TEST-NET-1/2/3) kullanılır:

| Site WAN | Lab adresi |
|---|---|
| "İnternet" çekirdeği (GNS3 NAT/Cloud'a bakan simüle ISP router) | 203.0.113.0/24 |
| Ankara WAN | 203.0.113.10/24 |
| İstanbul WAN | 203.0.113.20/24 |
| Londra WAN | 203.0.113.30/24 |
| Akademik WAN | 203.0.113.40/24 |

Gerçek üretimde her site ISP'den statik genel IP alır (A-02).

## 7. IPv6 (bilgi amaçlı, V-12)

- İç adresleme için **ULA** (RFC 4193, S-31): organizasyona **rastgele üretilmiş** bir /48 (örn. `fdXX:XXXX:XXXX::/48`; prefix RFC'nin algoritmasıyla üretilmeli, elle seçilmemeli).
- Alt ağ kimliği (16 bit) = site (1 hex basamak) + VLAN (3 hex basamak): Ankara (1) STUDENT (VLAN 50 = 0x032) → `fdXX:XXXX:XXXX:1032::/64`.
- Global IPv6: ISP'nin verdiği /48 veya /56 prefix'i ile NPTv6 ya da doğrudan GUA; lab kapsamı dışında.
- pfSense/OPNsense IPv6 destekler (genel bilgi); firewall kuralları IPv4 ile aynı zone mantığında ayrı ayrı yazılır (IPv6'da NAT yok → default deny daha da kritik).

## 8. DHCP ve DNS yerleşimi

| Servis | Yerleşim (V) | Gerekçe |
|---|---|---|
| DHCP | Her sitede firewall üzerinde (kullanıcı VLAN'ları) | Lab basitliği; üretimde Akademik için merkezi DHCP sunucusu + relay düşünülebilir |
| DNS çözümleyici | Her sitede firewall Unbound; iç alan adı (`k1fw.internal`, Ö) için Ankara SERVER'daki yetkili sunucuya yönlendirme | Yerel çözümleme, WAN kesintisinde yerel kayıtlar çalışır |
| Guest DNS | Yalnızca firewall'ın Guest arayüz IP'si; dış DNS'e doğrudan erişim kapalı (DNS tünelleme azaltımı) | Güvenlik |
| NTP | Firewall NTP sunucusu, üst kaynak havuz | Log tutarlılığı |

## 9. Açık noktalar

- A-01 gerçek sayılar → ADMIN/STAFF/STUDENT boyutları değişebilir.
- Q-02 ekip konumları → VLAN 80/81/90 hangi sitede.
- Q-10 IPv6 kapsamı.


---

# Siteler arası bağlantı


**Amaç:** Ankara, İstanbul, Londra ve Akademik Yerleşke arasındaki özel iletişimin nasıl taşınacağını tasarlamak.
**Kaynaklar:** S-05 (pfSense IPsec), S-14 (OPNsense VPN), S-32 (IKEv2, genel), S-06 (HA). **Tarih:** 2026-10-23
Adresler: `proposed-ip-plan.md` §5.

## 1. Seçenekler ve karar

| Seçenek | Artı | Eksi | Karar |
|---|---|---|---|
| **IPsec IKEv2 site-to-site (route-based / VTI)** | Standart, birlikte çalışabilir (S-05: üçüncü taraf cihazlarla), yüksek performans, dinamik yönlendirmeye uygun, pfSense/OPNsense yerleşik | PSK yönetimi; NAT-T gereksinimi | **Seçildi** (ADR-004) |
| IPsec policy-based | Basit | Her alt ağ çifti için Phase 2; yönlendirme esnekliği düşük | Yedek seçenek |
| WireGuard | Çok basit, hızlı | pfSense'te paket; kurumsal cihazlarla birlikte çalışabilirlik düşük; OPNsense belgesi IPsec'in site-to-site için genelde daha hızlı olduğunu söyler (S-14) | Opsiyonel karşılaştırma |
| OpenVPN site-to-site | Esnek | Tek çekirdek performansı; gereksiz katman | Hayır |
| MPLS/özel hat | Garanti SLA | Maliyet; lab'da anlamsız | Belgelenir (A-02) |
| SD-WAN (ticari) | Çoklu WAN yönetimi | Lisans | Kapsam dışı |

## 2. Topoloji: hub-and-spoke → full-mesh hazır

- **Hub:** Ankara (V-01). **Spoke:** İstanbul, Londra, Akademik.
- 3 tünel (4 site). Spoke-spoke trafiği hub üzerinden: ek gecikme (lab'da ölçülür, T-V2) ve hub WAN'ında iki kat yük. Spoke-spoke trafiği az beklenir (V: ekipler merkezi servislerle konuşur, birbirleriyle az).
- **Full-mesh geçiş tetikleyicisi (V):** İstanbul ↔ Akademik (SW-DEV ↔ RND veri) trafiği belirgin hale gelirse rezerve /30 ile doğrudan tünel eklenir; IP planı değişmez (NFR-18).

## 3. Tünel parametreleri (öneri)

| Parametre | Öneri | Gerekçe |
|---|---|---|
| IKE sürümü | IKEv2 | Modern, MOBIKE/DPD, daha az mesaj (S-05, S-14) |
| Kimlik doğrulama | Lab: PSK (≥32 rastgele karakter, tünel başına farklı); Üretim: X.509 sertifika (iç CA) | PSK sızıntısı tek tüneli etkiler; sertifika yönetimi daha güvenli ama lab'da fazla |
| Phase 1 şifreleme | AES-256-GCM (veya AES-128-GCM), PRF SHA-256, DH grup 14 (2048) veya ECP-256 (19) | Yaygın güvenli varsayılanlar (genel bilgi; NFR-03) |
| Phase 2 (ESP) | AES-GCM-128/256; PFS grup 14/19 | Aynı |
| Tünel modu | **VTI (route-based)** | Tek Phase 2; yönlendirme tablosuyla esneklik (S-05) |
| Yaşam süresi | P1 28800 s, P2 3600 s (genel varsayılan) | — |
| DPD | 10 s aralık, 5 deneme | Kesinti algılama (T-F2) |
| NAT-T | Açık | ISP CGNAT ihtimali (özellikle lab NAT node arkasında zorunlu) |
| MTU/MSS | VTI'da MSS clamp 1350–1400 | Parçalanma önleme (genel bilgi) |

## 4. Yönlendirme

- **Başlangıç: statik.** Hub'da her spoke bloğu (10.20/16, 10.30/16, 10.40/14) ilgili VTI'ya; spoke'ta 10.0.0.0/8 → VTI (hub). Spoke'un kendi /16'sı yerelde daha spesifik olduğu için öncelikli.
- **Opsiyonel: dinamik (OSPF/BGP, FRR eklentisi)** — spoke sayısı artarsa veya full-mesh'te. Lab için gereksiz; ADR-004'te "sonraya bırakıldı".
- Spoke'lar arası trafik hub üzerinden iki VTI geçer; hub firewall'unda **zone kuralları** uygulanır (VTI arayüzleri "TRANSIT" zone'u; kaynak/hedef alias'ları zone'a göre).

## 5. Firewall kuralları (VPN ile ilgili)

| Arayüz | Kural | Not |
|---|---|---|
| WAN | İzin: UDP 500, UDP 4500, ESP — yalnızca **bilinen peer IP'lerinden** | FR-13; peer IP alias'ı |
| WAN | Diğer her şey: reddet (varsayılan) + log yok (gürültü) | — |
| VTI / IPsec | Gelen trafik zone matrisine göre; **kesinlikle "any-any" yok** | En sık yapılan hata |
| VTI | Log: reddedilenler | FR-09 |

## 6. Remote-access VPN

| Konu | Öneri |
|---|---|
| Protokol | IKEv2 + EAP-MSCHAPv2 (işletim sistemi yerleşik istemcileri) **veya** OpenVPN (çapraz platform, lab'da kolay) — ADR-004'te OpenVPN lab tercihi (basit istemci doğrulaması), IKEv2 belgelenir |
| Sonlanma noktası | Ankara (hub) — tüm zone'lara hub üzerinden erişim; Akademik için ikinci sonlanma noktası opsiyonel |
| Havuz | 10.255.100.0/22; rol bazlı /24 → rol alias'ı → zone kuralları (FR-19) |
| Kimlik | Lab: yerel kullanıcı + sertifika; Üretim: RADIUS/LDAP + MFA (Q-13) |
| Split tunnel | Yalnızca 10.0.0.0/8 tünelden; internet yerelden (kullanıcı gizliliği ve bant) — ADMIN rolü için full-tunnel seçeneği |

## 7. Erişilebilirlik

- WAN kesintisinde tünel düşer; DPD + otomatik yeniden kurulum (FR-17, T-F2).
- HA'lı sitede (CARP) IPsec, CARP VIP üzerinde sonlanır; failover'da tünel yeniden kurulur (S-06; pfsync IPsec SA'larını senkronlamaz — genel bilgi, lab'da gözlemlenir).
- İkinci WAN (V-09) varsa: tünel yedek WAN'dan ikinci peer olarak tanımlanır; lab kapsamı dışı.

## 8. Lab'da doğrulama

T-V1 (tünel kurulumu ve uçtan uca ping/HTTP, pcap'te ESP), T-V2 (spoke-spoke hub üzerinden; traceroute), T-V3 (remote-access rol bazlı erişim), T-F2 (kesinti/kurtarma). Hiçbiri henüz çalıştırılmadı.
