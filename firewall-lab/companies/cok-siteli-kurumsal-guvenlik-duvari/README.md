# Çok Siteli Kurumsal Güvenlik Duvarı Projesi

> Contributed by `A*** M*** K***` ([@RedRiveRR](https://github.com/RedRiveRR)) · BGT207 Güvenlik Duvarı Çözümleri · 2026-2027 Güz midterm project.
> Student names are masked on purpose. Converted from the student's documentation-phase repository (Turkish); the eight most relevant documents are kept in full below.

# Genel bakış


"Güvenlik Duvarı Çözümleri" dersi ödevi. Hayali çok uluslu bir kurumun güvenlik
duvarı ve ağ mimarisi burada planlanır; henüz hiçbir yazılım kurulmadı, hiçbir
test çalıştırılmadı — bu şekilde **yazılı dokümantasyon fazı**dır.

## Bir Şirket Hayal Ediyoruz

Farklı ofislerimiz ve şubelerimiz var:

- **Ankara Ofisi**
- **İstanbul Ofisi**
- **Londra Ofisi**
- **Akademik Şube** (öğrenciler var / hocalar var / personel var)

**Yazılım ekibimiz** var, bir de **Ar-Ge ekibimiz.**

Akademik Şube'de **10.000 öğrencimiz** var.

İstekler:

- Şubelere bant genişliği tanımlama
- Adım adım tüm şubelerimize güvenlik duvarı kurma
- Her şube için bir klasörde personel sayısı, öğrenci sayısı, yazılım ve teknik sayısı

## Durum

- **Tamamlanan:** Araştırma, gereksinim tanımı, envanter, IP planı, VLAN/güvenlik bölgeleri, politika matrisi, test planı, top 5 ürün önerisi ve izleme planı.
- **Yapılmayan:** Yazılım kurulumu, konfigürasyon, gerçek test çalıştırması — öğretim elemanı onayı sonrası faz.

## Tüm Dokümanlar

Her klasörde işin hangi parçası varsa o lazım; README'den o dokümana tek tıkla gidilebilir.

### Araştırma (`arastirma/`)

| Doküman | Ne anlatıyor |
|---|---|
| [Araştırma Genel Bakış](arastirma/arastirma-genel-bakis.md) | Yöntem, kapsam ve ana bulgular tek sayfada |
| [Kaynaklar ve Referanslar](arastirma/kaynaklar-ve-referanslar.md) | K1–K21 numaralı kaynak listesi (resmi dokümanlar + RFC'ler) |
| [Bant Genişliği Planlaması](arastirma/bant-genisligi-planlamasi.md) | "Limit ≠ kapasite" kavramı ve Akademik Şube için S1/S2/S3 senaryoları |
| [Güvenlik Mimarisi](arastirma/guvenlik-mimarisi.md) | Hangi yetenek zorunlu, hangisi isteğe bağlı |
| [Güvenlik Duvarı Teknolojileri](arastirma/guvenlik-duvari-teknoloji-karsilastirmasi.md) | pfSense, OPNsense, FortiGate, Palo Alto, nftables karşılaştırması |
| [Simülasyon Platformları](arastirma/simulasyon-platformu-karsilastirmasi.md) | GNS3 vs EVE-NG vs Packet Tracer vs hipervizörler |

### Gereksinimler (`gereksinimler/`)

| Doküman | Ne anlatıyor |
|---|---|
| [Fonksiyonel Gereksinimler](gereksinimler/fonksiyonel-gereksinimler.md) | Ağın ne yapması gerekiyor (FR-01..17) |
| [Fonksiyonel Olmayan Gereksinimler](gereksinimler/fonksiyonel-olmayan-gereksinimler.md) | Güvenlik, erişilebilirlik, ölçeklenebilirlik (NFR-01..10) |
| [Varsayımlar ve Açık Sorular](gereksinimler/varsayimlar-ve-acik-sorular.md) | Ödevin verdiği bilgi vs varsayımlar; hocaya sorulacaklar |

### Envanter (`envanter/`) — her birim için kendi klasörü

- [Akademik Şube](envanter/akademik-sube/envanter.md) — 10.000 öğrenci; hoca 400, personel 150, teknik 20 [VARSAYIM]
- [Ankara Ofisi](envanter/ankara-ofisi/envanter.md) — personel 40, yazılım 10, teknik 6, Ar-Ge 4 [VARSAYIM]
- [İstanbul Ofisi](envanter/istanbul-ofisi/envanter.md) — personel 80, yazılım 25, teknik 12, Ar-Ge 6 [VARSAYIM]
- [Londra Ofisi](envanter/londra-ofisi/envanter.md) — personel 30, yazılım 8, teknik 5, Ar-Ge 5 [VARSAYIM]
- [Yazılım Ekibi](envanter/yazilim-ekibi/envanter.md) — toplam 43 (Ankara 10 / İstanbul 25 / Londra 8) [VARSAYIM]
- [Ar-Ge Ekibi](envanter/arge-ekibi/envanter.md) — toplam 15 (Ankara 4 / İstanbul 6 / Londra 5) [VARSAYIM]
- [BT ve Ağ Operasyonları](envanter/bt-ve-ag-operasyonlari/envanter.md) — sayı verilmedi [HOCAYA SORULACAK]

### Mimari (`mimari/`)

| Doküman | Ne anlatıyor |
|---|---|
| [Kavramsal Topoloji](mimari/kavramsal-topoloji.md) | Mermaid diyagramı; siteler, firewall'lar, bölgeler |
| [Önerilen IP Planı](mimari/onerilen-ip-plani.md) | 10.0.0.0/8 planı: site blokları, VLAN'lar, tüneller |
| [VLAN ve Güvenlik Bölgeleri](mimari/vlan-ve-guvenlik-bolgeleri.md) | Zone kodları (STU, MGMT, DMZ...) ve izolasyon ilkeleri |
| [Siteler Arası Bağlantı](mimari/siteler-arasi-baglanti.md) | IPsec VPN tasarım ilkeleri |

### Politikalar (`politikalar/`)

| Doküman | Ne anlatıyor |
|---|---|
| [Bant Genişliği Politikası](politikalar/bant-genisligi-politikasi.md) | Sınıf bazlı öncelik + limit matrisi (C1–C10) |
| [Site Bazlı Bant Genişliği Tanımları](politikalar/site-bant-genisligi-tanimlari.md) | Ankara/İstanbul/Londra/Akademik için hattan beklentisi ve VPN tünel kapasiteleri |
| [Güvenlik Duvarı Politika Matrisi](politikalar/guvenlik-duvari-politika-matrisi.md) | Bölge↔bölge izin kural özet tablosu (default-deny) |

### Kararlar (`kararlar/`)

| Doküman | Ne anlatıyor |
|---|---|
| [Karar Günlüğü](kararlar/karar-gunlugu.md) | Alınan kararlar (KARAR-001..) ve gerekçeleri |
| [Teknoloji Önerisi](kararlar/teknoloji-onerisi.md) | GNS3 + OPNsense önerisi, gerekçeler, sınırlar |
| [Top 5 Güvenlik Duvarı Önerisi](kararlar/top5-guvenlik-duvari-onerisi.md) | Her site/parça için sıralı top-5 öneri + hat tahmini |

### İzleme (`izleme/`)

| Doküman | Ne anlatıyor |
|---|---|
| [İzleme Planı](izleme/izleme-plani.md) | Log + metrik + akış üçlüsü; roller ve süreç; lab topolojisi |

### Doğrulama (`dogrulama/`)

| Doküman | Ne anlatıyor |
|---|---|
| [Test Planı](dogrulama/test-plani.md) | T-01..T-16; **hepsi "Çalıştırılmadı"** durumunda |

### Arşiv (`onceki-taslak/`)

İlk kısa taslak — içindeki sayılar ve komutlar **hükümsüz** kabul edilir; referans için saklandı (bkz. `onceki-taslak/NOT.md`).

## Okuma Sırası

1. Bu README (senaryo)
2. `gereksinimler/varsayimlar-ve-acik-sorular.md` — hangi bilgi gerçek, hangi varsayım
3. `envanter/` klasörleri
4. `kararlar/top5-guvenlik-duvari-onerisi.md` ve `politikalar/site-bant-genisligi-tanimlari.md` — hangi yerde hangi ürün ve hangi hat
5. `mimari/` + `politikalar/bant-genisligi-politikasi.md`
6. `izleme/izleme-plani.md` — izleme nasıl olacak
7. `dogrulama/test-plani.md` — simülasyon kurulunca ne test edilecek

## Not

Sayısal değerler ölçülmüş gereksinim değildir; varsayım veya örnektir. Etiket sistemi:
`[GERÇEK]`, `[VARSAYIM]`, `[İLUSTRATİF]`, `[ARAŞTIRILACAK]`, `[HOCAYA SORULACAK]`, `[DOĞRULANMADI]` — anlamları `OKUBENI.md` §3'te.


---

# Önerilen IP planı


**Amaç:** Çakışmasız, büyümeye açık, özetlenebilir (summarizable) bir adres stratejisi önermek.
**Durum:** **ÖNERİLEN / geçici.** Hiçbir cihaza uygulanmadı. Alt ağ boyutları varsayımlara (A-01..A-07) dayanır.

## 1. İlkeler
1. **RFC 1918** özel blok `10.0.0.0/8` kullanılır (K20): büyük, çok siteli kurumlar için en uygun (172.16/12 ve 192.168/16 daha küçük; 192.168.x ev ağlarıyla ve VPN istemcileriyle çakışma riski yüksektir).
2. Her site kendi `/16` bloğunu (Akademik: `/15`) alır → site başına tek özet rota (route summarization).
3. Alt ağın 3. okteti **VLAN ID** ile eşleşir (ofis siteleri) → okunabilirlik. Akademik öğrenci ağı istisnadır.
4. Siteler arası hiçbir blok çakışmaz; kullanılmayan bloklar rezervdir (büyüme).
5. Yönetim (Mgmt) ağı her sitede ayrı ve kullanıcı ağlarından yönlendirilmez.

## 2. Site Blokları
| Site | Blok | Not |
|---|---|---|
| Ankara | 10.10.0.0/16 | |
| İstanbul | 10.20.0.0/16 | Varsayılan VPN hub |
| Londra | 10.30.0.0/16 | |
| Akademik | 10.40.0.0/15 (10.40.0.0–10.41.255.255) | Öğrenci için 10.41.0.0/17 |
| Siteden bağımsız ekipler (Dev/R&D/IT Ops ortak) | 10.50.0.0/16 | Fiziksel yer belirlenince site bloğuna taşınabilir [HOCAYA SORULACAK] |
| Siteler arası tünel (transit) | 10.255.0.0/24 (/30'lar) | |
| Rezerv | 10.60.0.0/14 ve diğerleri | Yeni site/büyüme |

## 3. Ofis Sitelerinde Alt Ağlar (Ankara 10.10.x / İstanbul 10.20.x / Londra 10.30.x; x = VLAN)
| VLAN | Ad | Alt ağ (x = site) | Boyut gerekçesi |
|---|---|---|---|
| 10 | MGMT | 10.x.10.0/24 | Cihaz yönetimi (254 > ihtiyaç) |
| 20 | SRV | 10.x.20.0/24 | Sunucu sayısı < 50 |
| 30 | OFFICE (kullanıcılar) | 10.x.30.0/24 (İstanbul: /23) | ~80 çalışan×2 cihaz [VARSAYIM] |
| 60 | GUEST | 10.x.60.0/24 | Misafir cihazlar |
| 70 | DMZ | 10.x.70.0/24 | Yalnız İstanbul'da gerekli olabilir |
| 80 | DEV | 10.x.80.0/24 | Yazılım ekibi ofisteyse |
| 90 | RND | 10.x.90.0/24 | Ar-Ge ofisteyse |

## 4. Akademik Şube Alt Ağları
| VLAN | Ad | Alt ağ | Gerekçe |
|---|---|---|---|
| 10 | MGMT | 10.40.10.0/24 | |
| 20 | SRV/INFRA | 10.40.20.0/24 | LMS, SIS, DNS, DHCP, AD |
| 30 | ADM | 10.40.30.0/24 | İdari personel + yazıcılar |
| 40 | STAFF | 10.40.40.0/22 | ~400 hoca × 2 cihaz [VARSAYIM] |
| 60 | GUEST | 10.40.60.0/22 | Ziyaretçi |
| 65 | LAB | 10.40.64.0/22 | Bilgisayar sınıfları |
| 70 | DMZ | 10.40.70.0/24 | Dışa açık servisler |
| 500–531 | STU-01…32 | 10.41.0.0/17 → 32 adet /22 | 10.000 öğr. × 2 cihaz = 20.000 [VARSAYIM A-02]; tek VLAN büyük yayın alanı oluşturacağından bina/kat başına /22 |

Not: /22 = 1.022 kullanılabilir adres. Toplam öğrenci bloğu 32.766 adres → A-02'ye göre yaklaşık 1,6× büyüme payı.

## 5. Siteden Bağımsız Ekip Blokları (10.50.0.0/16)
| Ad | Alt ağ | Not |
|---|---|---|
| IT-OPS (jump host) | 10.50.10.0/24 | Yönetim istasyonları |
| SHARED-SVC (syslog, izleme, yedek) | 10.50.20.0/24 | |
| DEV | 10.50.80.0/23 | Git, CI/CD, artefakt |
| RND | 10.50.90.0/24 | Araştırma |

## 6. Siteler Arası ve WAN
| Bağlantı | Alt ağ | Not |
|---|---|---|
| Ankara – İstanbul tüneli | 10.255.0.0/30 | |
| Londra – İstanbul tüneli | 10.255.0.4/30 | |
| Akademik – İstanbul tüneli | 10.255.0.8/30 | |
| Simüle WAN/internet | 198.51.100.0/24 (dokümantasyon amaçlı TEST-NET-2 aralığı; RFC 5737 **[DOĞRULANMADI – RFC metni okunmadı]**) | Gerçek IP kullanılmaz |

## 7. DHCP / DNS / IPv6
- **DHCP:** Küçük sitelerde güvenlik duvarında; Akademikte sunucu bölgesinde merkezi DHCP + relay (L3 arayüzde). Öğrenci /22'lerinde kira süresi kısa (örn. 1–4 saat) [İLUSTRATİF] adres tükenmesine karşı.
- **DNS:** Her sitede önbellekli çözümleyici (resolver), kurumsal alan adı için merkezi yetkili sunucu (SRV); kullanıcılar yalnızca iç resolver'ı kullanır (dışarıya 53 engelli) – DNS güvenliği için.
- **IPv6 (isteğe bağlı):** ULA `fc00::/7` (RFC 4193, K21): rastgele 40-bit global ID ile `fdXX:XXXX:XXXX::/48`; site başına /48, VLAN başına /64. Gerçek prefiks üretimi uygulama fazında yapılır. Küresel IPv6 için sağlayıcıdan alınan prefiks gerekir [ARAŞTIRILACAK].


---

# VLAN ve güvenlik bölgeleri


**Amaç:** VLAN adlandırma standardı ve bölgeler arası iletişim ilkelerini belirlemek.
**Durum:** Önerilen mantıksal model. Bölgeler onaylanmış fiziksel ağlar değildir.

## 1. İsimlendirme Standardı
`<SITE>-<ZONE>-<VLANID>` örn. `IST-OFFICE-30`, `AKD-STU-501`. Site kodları: ANK, IST, LON, AKD. Bölge kodları: MGMT, SRV, OFFICE, ADM, STAFF, STU, GST, LAB, DMZ, DEV, RND.

## 2. VLAN Tablosu
Bkz. `onerilen-ip-plani.md` §3–5 (tek kaynak). Aynı VLAN ID'si aynı bölgeyi temsil eder (ör. 60 = GUEST).

## 3. Bölgeler Arası Trafik İlkeleri (özet; tam matris: `politikalar/guvenlik-duvari-politika-matrisi.md`)
**İletişim kurabilir (kısıtlı):**
- STU/STAFF/ADM/LAB → SRV: yalnızca uygulama portları (LMS HTTPS, DNS, DHCP, kimlik).
- ADM → SRV: SIS/ERP için ek portlar.
- DEV → SRV(artefakt): build/deploy portları. RND → DEV: yalnızca belirli veri aktarımı.
- MGMT → tüm bölgeler: yalnızca yönetim protokolleri (SSH, HTTPS, SNMP); tersi sadece log/SNMP yanıtı.

**İzole olmalı:**
- STU ↔ ADM, STU ↔ MGMT, STU ↔ DEV, STU ↔ RND, STU ↔ STU (client isolation).
- GST ↔ tüm iç bölgeler.
- DEV ↔ RND doğrudan (ara servis aracılığıyla).
- Kullanıcı bölgeleri → MGMT (hiçbiri).

## 4. Bölge Sahipliği ve Kontrol
Her bölge için bir sahip (İş sahibi), bir teknik sorumlu (BT Ops) ve kural gerekçe kaydı gerekir (`karar-gunlugu`).

## 5. Açık Noktalar
Wi-Fi VLAN ataması (SSID→VLAN, 802.1X dinamik VLAN) [ARAŞTIRILACAK]; Dev/RND/IT-Ops'un site yerleşimi [HOCAYA SORULACAK].


---

# Politika matrisi


**Amaç:** Hangi bölgeden hangisine hangi tür trafiğin izinli olduğunu tanımlamak.
**Durum:** Taslak; **varsayılan: hepsi REDDET.** Aşağıdaki "izin" yalnızca ilke düzeyidir, kural/port listesi uygulama fazında kesinleştirilir.
Lejant: `—` reddet | `P` portla sınırlı izin | `F` filtreli internet | `R` yalnız dönüş (established) | `✔` geniş izin

| Kaynak \ Hedef | STU | STAFF | ADM | GST | LAB | SRV | DEV | RND | MGMT | INTERNET |
|---|---|---|---|---|---|---|---|---|---|---|
| **STU** | — (izolasyon) | — | — | — | — | P (LMS, DNS, DHCP) | — | — | — | F |
| **STAFF** | R | — | P | — | P | P (LMS yönetim) | — | — | — | F |
| **ADM** | — | P | — | — | — | P (SIS/ERP) | — | — | — | F |
| **GST** | — | — | — | — | — | — (yalnız DNS dış) | — | — | — | F (kısıtlı, düşük bant) |
| **LAB** | — | — | — | — | — | P | — | — | — | F (sınav modunda kısıtlı) |
| **SRV** | R | R | R | — | R | P (servisler arası) | — | — | R | P (güncelleme) |
| **DEV** | — | — | — | — | — | P (artefakt/deploy) | — | P (veri aktarımı) | — | ✔ (80/443/22/9418…) izlenir |
| **RND** | — | — | — | — | — | P | P | — | — | P (izlenen çıkış) |
| **MGMT** | — | — | — | — | — | P (SSH/HTTPS/SNMP) | P | P | — | P (güncelleme) |

## İlkeler
1. Satırdaki bölge, sütundaki bölgeye *yeni bağlantı başlatamaz* (`—`), `R` ise yalnızca kendi başlattığı bağlantının yanıtı.
2. MGMT'e hiçbir kullanıcı bölgesi bağlantı başlatamaz; MGMT bu ağları yönetir.
3. INTERNET → iç bölgeler: yalnız DMZ'ye (yayınlanan servis, portla sınırlı); diğerleri reddedilir.
4. Her kural: sahibi, gerekçe, log seviyesi, gözden geçirme tarihi.
5. Reddedilen trafik loglanır (oran sınırı ile).
6. Siteler arası: yalnızca onaylı ağ çiftleri (örn. Londra OFFICE→İstanbul SRV); RND/MGMT siteler arası yalnızca BT Ops'tan.

## Siteye Özgü Notlar
- **Ankara/Londra:** küçük politika: OFFICE→SRV(P), OFFICE→INTERNET(F), GUEST→INTERNET.
- **İstanbul:** hub; DMZ ve siteler arası geçişler burada politika ile.
- **Akademik:** tablo tam geçerli; STU çok sayıda VLAN'a bölünür ve her biri aynı politikayı alır.


---

# Site bant genişliği tanımları


**Amaç:** Her site için ilüstratif dış hat (WAN) tanımı ve gerekçesi sunmak.
**Durum:** Taslak. **Tüm mutlak Mbps/Gbps değerleri [İLUSTRATİF]'tir**; ölçüm yok. Kesin değerler gerçek hat kapasitesi belirlenince güncellenir [ARAŞTIRILACAK].
Sınıf tanımları ve öncelikler için: `politikalar/bant-genisligi-politikasi.md` (C1–C10). Akademik Şube senaryoları için: `arastirma/bant-genisligi-planlamasi.md` (S1–S3).

## 1. Tanım Matrisi

| Site | Roller | Kullanıcı sayısı | Önerilen hat [İLUSTRATİF] | Kaygı | Not |
|---|---|---|---|---|---|
| **Ankara Ofisi (ANK)** | Merkez ofis; olası BT-Ops konumu (A-03) | ~40 [VARSAYIM] | 100–200 Mbps ↓ / 50–100 ↑ | VPN tünel trafiği az; yerel internet çıkışı | Yedekli hat [VARSAYIM] |
| **İstanbul Ofisi (IST)** | En büyük ofis; **VPN hub** (KARAR-004); log merkezi; DMZ | ~80 [VARSAYIM] | 300–500 Mbps ↓ / 200 ↑ (1 Gbps değerlendirilir) | Tüm tüneller buradan geçer: siteden bağımsız Dev/R&D bölgesi (10.50.0.0/16) trafiği de bu hattı kullanır | Hat arızalanırsa siteler arası trafik durur — tek hub riski [VARSAYIM] |
| **Londra Ofisi (LON)** | Küçük ofis; yerel internet çıkışı | ~30 [VARSAYIM] | 100 Mbps ↓ / 50 ↑ | TR↔UK RTT yüksek; merkezi uygulamalar VPN üzerinden | Yerel internet maliyeti [VARSAYIM] |
| **Akademik Şube (AKD)** | 10.000 öğrenci + personel; lab; Wi-Fi | 10.000 [GERÇEK] | 10 Gbps (S2 senaryosuna göre) | S3 stres senaryosunda tıkanır → hat büyütmek yerine C3→C9 limiter + önbellek | Senaryolar: S1 ≈1,5 / S2 ≈10,7 / S3 ≈28 Gbps |

**Okuma:** Hat değerleri ölçüm değil, büyüklük sırası verir. Site bazlı istekler hoca/ISP bilgisi olmadan kesinleşemez.

## 2. VPN Tüneli Bant Genişliği [İLUSTRATİF]

| Tünel | Hedef kapasite | Amaç |
|---|---|---|
| ANK–IST | 100 Mbps | Kurumsal trafik + geçiş trafiği |
| IST–LON | 100 Mbps | Kurumsal trafik (UK veri koruma sorusu açık) |
| ANK–AKD, IST–AKD | 500 Mbps | Ar-Ge / BT-Ops ↔ akademik etkileşim; toplu veri aktarımı (C6) |

**Kural:** Tünel hedefi, uç sitenin dış hattının **toplamından küçük** tutulur; tünel + yerel internet aynı hattı paylaştığından tek tünel hattı tüketmemelidir. Değerler uygulama fazında kesinleşir; lab ölçeğinde küçültülerek test edilir.

## 3. Açık Sorular
- Gerçek hat kapasiteleri ve sağlayıcı teklifleri → [ARAŞTIRILACAK] / [HOCAYA SORULACAK]
- Yedek hat gereksinimi (özellikle İstanbul hub) → [HOCAYA SORULACAK]
- Lab ölçek çarpanı → `dogrulama/test-plani.md` bağdaştırılır


---

# Bant genişliği planlaması


**Amaç:** Çok uluslu bir kurumda bant genişliğinin nasıl planlanıp yönetileceğini açıklamak ve akademik bölüm için senaryolar üretmek.
**Durum:** Taslak. **Tüm sayısal değerler [İLUSTRATİF]'tir; ölçülmüş gereksinim değildir.**

## 1. Temel Kavramlar (dört farklı büyüklük)
| Kavram | Tanım | Örnek yanılgı |
|---|---|---|
| Yapılandırılmış kişi başı limit | Politikada kullanıcıya tanınan **tavan** (cap) | "10.000 × 20 Mbps = 200 Gbps gerekir" ✗ |
| Eşzamanlı talep | Aynı anda gerçekten trafik üreten kullanıcı sayısı × ortalama hız | Limit, talebin göstergesi değildir |
| Toplam (aggregate) kapasite | Dış hat(lar)ın toplam hızı (ör. 2×N Gbps) | Kiralanan kapasite ≠ kullanılan |
| Tepe kullanım | Belirli bir zaman dilimindeki (ör. 5 dk) en yüksek talep | Ortalama ile tasarım yapmak tepede kalitesizlik yaratır |

**Oversubscription (aşırı abonelik):** Dışarıya toplam limitlerin toplamından çok daha az kapasite kiralanır, çünkü kullanıcılar aynı anda tavan hızlarında kullanmaz. Oran sabit değildir; ölçümle (utilization %, p95) ayarlanır **[ARAŞTIRILACAK: üniversite ağı için tipik oranlar, kaynak bulunamadı]**.

## 2. Tahmin Yöntemi
`Tepe talep ≈ (Toplam kullanıcı × eşzamanlılık oranı) × aktif kullanıcı başına ortalama hız × (1 + güvenlik payı)`
Kapasite = tepe talep ÷ hedef azami doluluk (örn. %70). Önbellek/CDN/yerel yansı (mirror) talebi azaltır.
Ayrıca öğrenci ağı ile personel/yönetim trafiği **ayrı** hesaplanır ve ayrı korunur (bkz. §4).

## 3. Akademik Bölüm için Üç Hipotetik Senaryo ([İLUSTRATİF])
Toplam öğrenci: 10.000 **[GERÇEK]**. Diğer parametreler **[VARSAYIM]**.

| Senaryo | Varsayım | Eşzamanlı kullanıcı | Aktif kul. başı ort. hız | Ham tepe talep | %70 hedef doluluk ile hat |
|---|---|---|---|---|---|
| S1 – Normal ders günü | Öğlen; ders materyali, web, e-posta | %10 = 1.000 | 1 Mbps | 1 Gbps | ≈ 1,5 Gbps |
| S2 – Yoğun dönem (vize/online sınav, canlı ders) | Video ders + LMS sınav; birçok akış | %25 = 2.500 | 3 Mbps | 7,5 Gbps | ≈ 10,7 Gbps |
| S3 – Stres (büyük işletim sistemi/oyun güncellemesi + yurt akşamı) | Streaming + toplu indirme; %40 | %40 = 4.000 | 5 Mbps | 20 Gbps | ≈ 28 Gbps; politika ile S3 sınırlanmalı |

Okuma: Kişi başı 20 Mbps tavan koyulsa bile S1'de toplam talep 1 Gbps, tavanların toplamı 200 Gbps değildir. S3 gibi durumlarda hat artırmak yerine **trafik sınıflandırma + adil paylaşım + önbellek** tercih edilir.
Simülasyon labında değerler ölçeklenir (ör. 1:100, iperf3 ile) **[VARSAYIM]**.

## 4. Departman Bazlı Ayırma (kavramsal)
- Akademik öğrenci ağı, personel/yönetim ve kritik servislerden **mantıksal olarak ayrılır**; öğrenci yoğunluğu personel erişimini bozmasın diye personel/yönetim için **garantili minimum** tanımlanır.
- Yazılım/Ar-Ge: büyük indirme (paket, imaj, Git, CI/CD, artefakt) ve transfer ihtiyacı; **yüksek tavan ama düşük öncelik** (toplu iş) ya da zaman çizelgeli (gece) yaklaşımı.
- Kritik servisler (VoIP, kimlik doğrulama, DNS, LMS, sınav): düşük gecikme için öncelikli kuyruk/garantili oran.
- Misafir Wi-Fi: düşük tavan, sınırlı portlar, iç ağa erişim yok, client isolation.

## 5. Mekanizmalar
| Mekanizma | Ne yapar | Not |
|---|---|---|
| QoS / sınıflandırma (DSCP) | Paketleri sınıflandırıp işaretler | İşaretler yalnızca *güvenilir* sınırda geçerli sayılmalı |
| Traffic shaping | Hızı tamponlayarak sınırlar (gecikme artar, paket kaybı azalır) | Çıkış (egress) yönünde etkilidir |
| Policing | Hız aşıldığında paketi atar/yeniden işaretler | Daha ucuz, TCP için sert |
| Application-aware yönetim | Port değil uygulama kimliğine göre | Genelde NGFW özelliği; açık kaynakta sınırlı **[doğrulanmadı]** |
| Adil paylaşım (fair-use) | Kişi başı eşitleme, kota/yavaşlatma | OPNsense'te "Share bandwidth evenly" senaryosu belgelenmiş (K7) |
| Bufferbloat azaltma | FQ-CoDel gibi aktif kuyruk yönetimi | OPNsense "Fighting Bufferbloat with FQ_CoDel" (K7) |
| İzleme / kapasite planlama | NetFlow/sFlow, SNMP, p95, trend | **[ARAŞTIRILACAK]** hangi araç simülasyonda kullanılacak |

Platforma özgü notlar: OPNsense'te kuyruk **ağırlığı öncelik değildir** (K6); pfSense'te ALTQ verimsiz olduğu belirtilir, Limiters sert tavan için (K3).

## 6. Açık Sorular
Dış hat sayısı/tipi (yedekli mi?), üniversite eşzamanlılık verisi, VoIP var mı, Londra–Türkiye arası gecikme beklentisi → `gereksinimler/varsayimlar-ve-acik-sorular.md`.
Politika matrisi: `politikalar/bant-genisligi-politikasi.md`.


---

# Top 5 güvenlik duvarı önerisi


**Amaç:** Her bir siteye ve parçaya (hub, DMZ, Dev/R&D bölgesi, öğrenci ağı, dış hat) kurulabilecek en iyi güvenlik duvarı önerilerini sıralı sunmak.
**Durum:** Öneri – öğretim elemanı onayı bekliyor. Fiyat bilgisi yok; lisans kısıtları kaynaklarla işaretli.
Kaynaklar: `arastirma/guvenlik-duvari-teknoloji-karsilastirmasi.md`, `arastirma/kaynaklar-ve-referanslar.md` (K1–K21). Site hattı tahminleri: `politikalar/site-bant-genisligi-tanimlari.md`.

## 1. Genel Sıralama (ödev gereksinimlerine göre)

| Sıra | Ürün | Lisans | Ödev uygunluğu | Kaynak |
|---|---|---|---|---|
| 1 | **OPNsense** | Ücretsiz (lisans metni doğrulanacak [ARAŞTIRILACAK]) | Çok yüksek: stateful, NAT, VLAN, pipe/queue QoS, S2S VPN, log | K5–K7 |
| 2 | **pfSense CE** | Ücretsiz | Çok yüksek: resmi dokümanlı IPsec (K4), Limiters (K3), 1 GB RAM min (K1) | K1–K4 |
| 3 | **FortiGate-VM** | Kalıcı değerlendirme lisansı (hesap başına 1 kopya) | Orta: eval sınırı 1 vCPU / 2 GB / 3 arayüz / düşük şifreleme [kısmen doğrulandı] | K8–K9 |
| 4 | **Palo Alto VM-Series** | 30 gün deneme, portal hesabı | Orta: ağır (VM-50: 2 vCPU, ~5,5 GB RAM, 60 GB disk); güncel şartlar doğrulanmadı | K10–K12 |
| 5 | **Linux nftables** | Ücretsiz | Öğretici yedek plan: tam kontrol, arayüz yok; lab ölçeğinde sunucu/istemci düğümleri için | K19 |

**Not:** Packet Tracer bir güvenlik duvarı *değil*, simülatördür; listeye girmez (K17). GNS3/EVE-NG ise güvenlik duvarının *çalıştırıldığı ortamdır*, ürün değildir.

## 2. Site ve Parça Başına Öneri + Bant Genişliği Tahmini

**Tüm hat değerleri [İLUSTRATİF]'tir** ve `politikalar/site-bant-genisligi-tanimlari.md` §1–2 ile tutarlıdır.

| Yer / Parça | Rol | 1. tercih | 2. tercih | Yedek | Hat tahmini | Gerekçe |
|---|---|---|---|---|---|---|
| **Ankara Ofisi (ANK)** | Merkez ofis firewall | OPNsense | pfSense CE | nftables | 100–200 Mbps ↓ / 50–100 ↑ | Küçük ofis; tek cihazda VLAN + NAT + spoke VPN |
| **İstanbul Ofisi (IST)** — VPN hub + log merkezi + DMZ | Projenin kalbi | **OPNsense** | pfSense CE | nftables | **300–500 Mbps ↓ / 200 ↑** (1 Gbps değerlendirilir) | Pipe/queue QoS (K6–K7) + syslog + S2S tünelleri tek kutuda; log merkezi ayrık VM |
| **İstanbul — Dev/R&D bölgesi (10.50.0.0/16)** | Geliştirici/araştırma izolasyonu | pfSense CE | OPNsense | nftables | 100 Mbps geçiş (toplam içinde) | Sınır cihazı basit tutulur; izolasyon kural matrisinde |
| **Londra Ofisi (LON)** | UK ofis + veri koruma sınırı | pfSense CE | OPNsense | FortiGate-VM eval (kısıtlı) | 100 Mbps ↓ / 50 ↑ | Yerel internet çıkışı; küçük ölçek; eval tek kopya merkeze ayrılır [VARSAYIM] |
| **Akademik Şube (AKD) — kenar firewall** | 10.000 kullanıcı | **OPNsense** (FQ_CoDel + adil paylaşım senaryoları, K7) | pfSense CE | nftables | **10 Gbps** (S2'ye göre) | Per-IP limiter + C1–C9 sınıf kuyruğu; adil kullanım kritik |
| **Akademik Şube — lab alt bölgesi (LAB)** | Öğrenci lab izolasyonu | pfSense CE | OPNsense | nftables | Hat içinde sınırlı | Basit varyant, VLAN altı |
| **Tüm siteler — istemci/sunucu düğümleri** | Host/Bilgisayar | FreeBSD/Linux (+ nftables, K19) | — | — | Uygulanmaz | GNS3 topolojisinin dolgu düğümleri |

**Okuma:** Tercihler keyfi değil; kayıtlı kaynak + özellik eşleşmesinden gelir. 1. ve 2. tercihler birbirinin yerine geçebilir; hoca pfSense'i işaret ederse pfSense CE birincil yapılarak önceki öneri (KARAR-003) güncellenir.

## 3. Hocaya Bağımlı Sorular
- Tamamen açık kaynak mı? (Q-01) → 1–2. sıradan biri zorunlu olur.
- Ticari deneyim isteniyor mu? (Q-04) → FortiGate-VM eval kısıtlarıyla birlikte eklenebilir.
- Hoca kendi bilgisayarında pfSense kullanıyor mu? → pfSense CE birincil seçilir, OPNsense alternatif yazılır.


---

# İzleme planı


**Amaç:** Güvenlik duvarları ve ağ altyapısının nasıl izleneceğini tanımlamak.
**Durum:** Taslak. Lab karşılıkları uygulama fazında kesinleşir.

## 1. Profesyonel Dünyada İzleme

Profesyonel ağ izleme üç veri türüne dayanır. Sektörde bu üçlüye "observability" denir:

| Veri türü | Ne söyler | Tipik araçlar |
|---|---|---|
| Log | Firewall izin/reddi, VPN olayları, sistem olayları | syslog; SIEM: Elastic, Splunk, Graylog, Wazuh |
| Metrik | CPU, RAM, arayüz hızı, paket kaybı, oturum sayısı | SNMP; Prometheus, Zabbix, Grafana |
| Akış | Kim, nereye, hangi port, ne kadar veri | NetFlow/sFlow; nfdump, ntopng |

Yaygın ilke: tek veri kaynağına güvenilmez. Log, metrik ve akış birlikte doğrulanır.

## 2. Sistematik Kısım: Yapımızda Nasıl Olacak

| Bileşen | Kaynak | Lab karşılığı | Durum |
|---|---|---|---|
| Firewall logları | OPNsense/pfSense syslog çıktısı | Tek syslog VM (rsyslog), İST MGMT ağı | Planlı |
| Trafik akışı | NetFlow export | Aynı izleme VM'de nfdump/ntopng | Planlı [ARAŞTIRILACAK] |
| Cihaz metrikleri | SNMP | Aynı izleme VM'de Prometheus veya Zabbix | Planlı [ARAŞTIRILACAK] |
| Uyarı | p95 hat kullanımı > %70 [İLUSTRATİF] | Basit kontrol scripti | Planlı |
| Pano | Toplanan metrikler | Grafana veya terminal raporu | Planlı |

Bant genişliği bağlantıları:
- Sınıf kullanımı ve p95 tetiği: `politikalar/bant-genisligi-politikasi.md`
- Site hat hedefleri: `politikalar/site-bant-genisligi-tanimlari.md` §1 ve §2

Kural: İzleme verisi kullanıcı ağından ayrık MGMT ağını kullanır. Kullanıcı bölgesinden yönetim ağına erişim yoktur (bkz. `mimari/vlan-ve-guvenlik-bolgeleri.md`).

## 3. İnsan Kısımı: Roller ve Süreç

Profesyonel dünyada izleme yalnız araç değildir; süreç işin diğer yarısıdır.

Roller (BT ve Ağ Operasyonları):

| Rol | Sorumluluk |
|---|---|
| Ağ yöneticisi | Firewall kural onayı, VLAN ve VPN yönetimi |
| Sistem yöneticisi | Sunucu metrikleri, yedekleme, saklama |
| Güvenlik analisti | Log triyajı, saldırı işareti taraması |
| Helpdesk | Kullanıcı şikayetini ekiplere doğru yönlendirme |
| Nöbet (on-call) | Acil durumlarda mesai dışı müdahale [VARSAYIM] |

Süreç akışı (profesyonel standart):

1. Alarm gelir
2. Triyaj: hangi site, hangi sınıf (C1–C9), hangi bölge
3. Runbook: önceden yazılmış müdahale adımları
4. Eskalasyon: sorun çözülmezse üst kişiye aktarım
5. Olay kaydı: ne oldu, ne yapıldı
6. Postmortem: kök neden ve tekrar etmeme adımı

## 4. Lab Ölçeği

Projede tek kişi (öğrenci) tüm rolleri üstlenir. Süreç adımları basit checklist olarak uygulanır. Her test ve olay için çıktı ve zaman damgası toplanır; test bağlantıları `dogrulama/test-plani.md`'dedir.

## 5. Lab Topolojisi

```
              İzleme VM (syslog + NetFlow + SNMP + pano)
                             ↑
  ANK ──── IPsec ────→ IST (hub) ←──── IPsec ──── LON
                             ↑↓
                        AKD (akademik)
```

Tüm izleme verisi MGMT ağı üzerinden İST'teki izleme VM'sine akar. İzleme trafiği kullanıcı trafiği ile aynı VLAN'ı paylaşmaz.

## 6. Açık Sorular [HOCAYA SORULACAK]
1. Log saklama süresi ne olsun? (NFR-06)
2. Ücretsiz araç seti yeterli mi, yoksa ticari çözüm mü isteniyor?
3. Alarm eşikleri (p95 %70) uygun mu?
