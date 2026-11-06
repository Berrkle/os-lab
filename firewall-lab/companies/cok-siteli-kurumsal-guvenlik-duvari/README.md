# Çok Siteli Kurumsal Güvenlik Duvarı Projesi

> `A*** M*** K***` ([@RedRiveRR](https://github.com/RedRiveRR)) · BGT207 Güvenlik Duvarı Çözümleri · 2026-2027 Güz.
> Bu bölüm, öğrencinin dokümantasyon deposunun (araştırma, envanter, IP planı, politika matrisi, izleme planı)
> firewall-lab kurallarına göre yeniden yazılmış hâlidir. Yapılandırılmış veri `company.json`'da, gerekçeler burada.

## 1. Şirket

Hayali bir eğitim ve yazılım şirketi. Ödevin verdiği iskelet: Ankara, İstanbul ve Londra'da ofisler, 10.000 öğrencili
bir akademik kampüs, ayrıca yazılım ve Ar-Ge ekipleri. Ödevin vermediği her sayı bizim varsayımımızdır ve
dokümantasyon deposundaki envanterden alınmıştır.

| Site | Rol | Personel | Yazılım | Ar-Ge | Öğrenci | Toplam |
|---|---|---:|---:|---:|---:|---:|
| Ankara Genel Merkez | headquarters | 46 (40 + 6 teknik) | 10 | 4 | — | 60 |
| İstanbul Ofisi | branch, **VPN hub + DMZ** | 92 (80 + 12 teknik) | 25 | 6 | — | 123 |
| Londra Ofisi | branch | 35 (30 + 5 teknik) | 8 | 5 | — | 48 |
| Akademik Kampüs | campus | 570 (400 hoca + 150 idari + 20 teknik) | — | — | 10.000 | 10.570 |
| İstanbul Veri Merkezi | datacenter | — (BT Ops uzaktan yönetir) | — | — | — | — |

İlk taslakta yazılım ve Ar-Ge ekipleri "yeri belirsiz mantıksal bölge" olarak `10.50.0.0/16`'da duruyordu. Envanter
ekipleri zaten ofislere dağıtmıştı (Ankara 10/4, İstanbul 25/6, Londra 8/5). Bu yüzden insanlar bulundukları ofiste
kendi DEV ve RND VLAN'larına alındı. `10.50.0.0/16` ise ekiplerin **sunucularını** (git/CI, araştırma verisi, ERP, SIEM)
barındıran İstanbul veri merkezi oldu. Bir kişinin dizüstü bilgisayarı ile ekibin kaynak kodu artık aynı ağda durmuyor.

## 2. Ağ gerekçesi

### Adres planı: site başına bir blok

| Site | Blok | Neden bu boyut |
|---|---|---|
| Ankara | `10.10.0.0/16` | Tek özet rota; ~180 cihaz için bol pay, büyümeye açık |
| İstanbul | `10.20.0.0/16` | Ofis + DMZ + VPN rol havuzları (`10.20.200.0/21`) |
| Londra | `10.30.0.0/16` | Aynı şablon, çakışma yok |
| Akademik | `10.40.0.0/15` | Öğrenci bloğu tek başına `10.41.0.0/17` |
| Veri merkezi | `10.50.0.0/16` | Ortak servisler |

Her site kendi bloğunu aldığı için site-to-site VPN'de çakışma olmaz ve her tünel tek bir özet rotayla tanımlanır.
Ofislerde üçüncü oktet VLAN numarasına eşittir (`10.x.30.0` = VLAN 30 OFFICE). Bu sayede log okuyan herkes adresten
segmenti tanır.

### Alt ağları insana göre değil cihaza göre boyutlandırmak

- **Ofisler:** Kişi başı ~3 cihaz hesapladık (dizüstü, telefon, IP telefon veya tablet). İstanbul OFFICE 92 × 3 ≈ 280
  adres eder; bu `/24`'e sığmadığı için `/23` verildi. Ankara (~140) ve Londra (~105) için `/24` yeterli ve %80 civarı pay bırakıyor.
- **Kampüs öğrencileri:** 10.000 öğrenci × 2-3 cihaz = 20.000-30.000 adres. Tek bir `/17` (32.766) ayırdık ama onu tek
  VLAN yapmadık: **32 adet `/22`** (VLAN 500-531), her bina veya kat için bir tane. 30.000 cihazlık tek bir yayın alanında
  ARP/mDNS fırtınası ve DHCP darboğazı çıkar. `/22` başına ~1.000 cihaz yönetilebilir bir boyut. Kira süresi 1-4 saat; böylece
  kampüsten ayrılan telefonların adresleri birikmez.
- **Personel (kampüs):** 420 kişi × 2,5 ≈ 1.050 adres, `/22`.

### VLAN sınırları: role göre bölmek

Her ofiste aynı yedi segment var: **MGMT, SRV, OFFICE, PRINT-IOT, GUEST, DEV, RND**. Kampüste bunlara **ADM, STAFF, LAB,
STU ve DMZ** ekleniyor.

- **RND'nin doğrudan interneti yok.** Ar-Ge yalnız kimlik doğrulamalı bir proxy'ye (3128) çıkıyor ve proxy alan adı izin
  listesi uyguluyor. Proxy dışındaki her çıkış loglanıp düşürülüyor. Fikri mülkiyet sızıntısı en çok buradan olur.
- **DEV**, git (SSH/HTTPS) ve paket depolarına yalnız giden yönde çıkabiliyor. Kodu dışarıya değil iç Gitea/CI'a (`10.50.80.0/23`) itiyor.
- **DEV ↔ RND doğrudan konuşmuyor**; veri yalnız onaylı aktarım servisiyle geçiyor (veri merkezi kuralı).
- **PRINT-IOT / IOT:** Kameralar yalnız NVR'a konuşabiliyor. Ele geçirilmiş bir kamera ofisi göremiyor.
- **GUEST:** Yalnız 80/443 açık, kişi başı 5 Mbps. Kurumsal `10/8` bloğuna giden trafik `reject` ile kesiliyor. Bu iç
  taraf olduğundan hızlı ret, zaman aşımı beklemekten iyi.
- **MGMT:** Firewall, switch, AP ve iDRAC arayüzleri burada. **Yalnız BT Ops bastion ağından (`10.50.15.0/24`)**
  erişilebiliyor; LAN'dan ya da internetten erişim yok. Bastion dışından MGMT'ye gelen her paket SOC'a uyarı üretiyor,
  çünkü bu yanal hareket işaretidir.
- **Öğrenciler** LMS/SIS'e yalnız 443 ile ulaşabiliyor. İdari, personel ve yönetim ağlarına giden her şey reddediliyor.
  Öğrenciler arası trafiği de AP üzerindeki client isolation kesiyor.

### DMZ'de neler var

| DMZ | İçerik | İçeri giden tek yol |
|---|---|---|
| İstanbul `10.20.70.0/24` | Kurumsal web sitesi ve **mobil uygulama API'si** için ters proxy + ModSecurity; posta ağ geçidi | proxy → `10.50.25.30:8443`, posta GW → `10.50.25.25:25` |
| Kampüs `10.40.70.0/24` | LMS (Moodle) + SIS ters proxy | proxy → `10.40.20.30:8443` |

Web trafiği **yalnız Cloudflare IP aralıklarından** kabul ediliyor. Orijine doğrudan gelen 80/443 düşürülüyor, böylece WAF
atlatılamıyor. 80 portu yalnız 443'e yönlendirme için açık. DMZ'den kurumsal ağa giden geri kalan her şey ve DMZ'den
internete doğrudan çıkış düşürülüyor (ters kabuk önlemi); tek istisna, posta ağ geçidinin dışarıya SMTP 25 teslimi. Yamalar iç apt yansısından geliyor.

### Neden her kural böyle sıralandı

İlk eşleşme kazanır. Bu yüzden her kural setinin sırası şu:

1. Sıcak yollar ve kenar: VPN el sıkışması `limit`, Cloudflare'den gelen web.
2. **Temel servisler:** DHCP 67/68, DNS 53 (yalnız iç çözümleyiciye; istemcilerden dış DNS'e çıkış engelli), NTP 123.
3. Segment izinleri.
4. Yönetim.
5. Son kural olarak **varsayılan reddet**.

Kenarda `deny` (sessiz) kullanıldı, iç tarafta `reject`. Hiçbir `allow` kuralı portsuz değil. Her kuralın `note` alanı
o kuralın neden var olduğunu ve kaldırılırsa neyin bozulacağını söylüyor (toplam 131 kural, 6 firewall).

## 3. Bant genişliği

Yöntem dokümantasyon deposundaki ile aynı: **tepe talep ≈ kullanıcı × eşzamanlılık × aktif kullanıcı başı hız**, hat
ise bunun %70 doluluğa göre büyütülmüş hâli. Kişi başı tavan bir kapasite değildir: 10.000 × 20 Mbps = 200 Gbps hesabı yanlıştır.

| Site | Hat (↓/↑) | Neyin tükettiği | Yedek |
|---|---|---|---|
| Ankara | 300 / 150 Mbps | ~30 eşzamanlı toplantı × 2,5 Mbps ≈ 75; SaaS/web ~60; git/paket patlamaları ~50; hub tüneli ~50 → ~235 Mbps tepe | 4G/LTE 50 Mbps, SD-WAN failover |
| İstanbul | 1000 / 500 Mbps | Tüm tüneller hub'dan geçiyor (ANK 100, LON 100, AKD 500 Mbps hedef), uzaktan erişim VPN'i, DMZ (Cloudflare önbelleği yükü azaltıyor) | İkinci fiber ISP 500 Mbps |
| Londra | 200 / 100 Mbps | TR↔UK toplantıları, SaaS, ERP tüneli | 4G/5G 50 Mbps |
| Kampüs | 10 / 10 Gbps | S1 normal gün ≈ 1,5 Gbps; **S2 sınav haftası ≈ 7,5 Gbps ham tepe**; S3 (toplu güncelleme) ≈ 20 Gbps ve politikayla sınırlanıyor | ULAKNET 10 Gbps + ticari 2 Gbps |
| Veri merkezi | 5 / 5 Gbps (iç) | IPS'ten geçen doğu-batı trafiği; yedekleme akışı ayrı depolama VLAN'ında L2'de kalıyor | İnternet hub'ın çift hattından |

Kampüste S3 senaryosu için hat büyütülmüyor; trafik yönetiliyor. Öğrenci web çıkışı bir `limit` kuralı: IP başına
20 Mbps ve C7/C8 kuyrukları. Oyun ve işletim sistemi güncelleme CDN'leri düşük öncelikli C8 sınıfında. Personel (C4) ve
LMS/sınav (C3) trafiği için garantili minimum tanımlı, öğrenci yoğunluğu bunları ezemiyor. Sınıfların tamamı
[bant genişliği politikası](https://github.com/RedRiveRR/guvenlik-duvari-projesi/blob/main/politikalar/bant-genisligi-politikasi.md) belgesinde (C1-C10).

## 4. Ürün seçimi: her segment için en iyi beş

**Ölçüt:** UTM/IPS açıkken ölçülen throughput (Fortinet'te "Threat Protection", Palo Alto'da "Threat Prevention").
Bu değer hattın üstünde olmalı ve tepe için pay bırakmalı. Fiyatlar **HA çifti + 1 yıl güvenlik aboneliği** için
**yaklaşık** USD değerleridir. Bayi listelerinden derlendi ve satın almadan önce distribütör teklifiyle doğrulanmalı.
Kaynağı bayi sayfası olan veya değeri bizim tahminimiz olan rakamlar tabloda işaretli.

### Filo kararı: neden her kenarda FortiGate

Dokümantasyon fazında birinci tercih OPNsense'ti. O sıralama **lab lisansına** göreydi: ücretsiz, GNS3'te çalışıyor.
Gerçek bir şirket için fiyat ve IPS açık throughput eklenince sonuç değişiyor:

1. **Tek yönetim düzlemi.** Beş site, altı firewall ve SD-WAN tek FortiManager'dan yönetiliyor; aynı IPsec şablonu ve aynı
   kural modeli her yerde geçerli. Beş farklı kutu, kutu başına daha ucuz olsa da işletmesi daha pahalıdır.
2. **Kanıtlanabilir IPS throughput.** Açık kaynak seçenekler (OPNsense/pfSense + Suricata) için satıcıların yayımladığı
   IPS açık rakam yok. 10 Gbps kampüs kenarını kanıtlayamadığımız bir sayıya emanet etmiyoruz.
3. **HA, SD-WAN çift ISP ve ZTNA** aynı lisansta geliyor.

OPNsense/pfSense listeden çıkmadı: her segmentte en güçlü ucuz alternatif olarak duruyorlar. Lab prototipi de
(`vm/`, nftables) onlarla yapılıyor.

### Ankara: perimeter (300 Mbps)

| # | Ürün | TP (Gbps) | ~USD | Karar |
|---|---|---:|---:|---|
| ✔ | **FortiGate 80F** HA | 0,9 ᵇ | 4.600 | Hattın 3 katı, filo standardı |
| 2 | Sophos XGS 2300 | 1,4 ᵇ | 7.000 | İkinci satıcı, filo SD-WAN'ı zayıf |
| 3 | Palo Alto PA-450 | 1,6 ᵇ | 9.000 | En iyi App-ID ama 2 kat fiyat ve ayrıca Panorama gerekiyor |
| 4 | Netgate 8200 (pfSense Plus) | 18,5 (IPS kapalı) | 3.300 | IPS açık değeri yayımlanmamış |
| 5 | OPNsense DEC2752 | ~0,8 ᵗ | 3.000 | Destek ve filo yönetimi zayıf; lab'da kullanılıyor |

### İstanbul: hub perimeter (1 Gbps + tüm tüneller)

| # | Ürün | TP (Gbps) | ~USD | Karar |
|---|---|---:|---:|---|
| ✔ | **FortiGate 200G** HA | 6 ᵇ | 30.000 | IPsec 36 Gbps; 200F'nin siparişi 2026-03-01'de kapandığı için halefi seçildi |
| 2 | Check Point Quantum Force 9300 | 10,5 ᶜ | 60.000 | Pahalı; ekipte deneyim yok |
| 3 | Palo Alto PA-3440 | 11 ᵇ | 70.000 | 1 Gbps hat için 2,3 kat fiyat |
| 4 | Sophos XGS 2300 | 1,4 ᵇ | 7.000 | Hub için dar, tepeye pay bırakmıyor |
| 5 | Netgate 8200 | IPsec 3,24 | 3.300 | IPS değeri yok, ZTNA yok |

### İstanbul: DMZ / WAF

Normal bir firewall uygulama katmanındaki bir hatayı durduramaz. Derste canlı izlediğimiz PHP RCE, izinli 443 portu
üzerinden geliyordu. Bu yüzden DMZ'nin "firewall"ı bir WAF.

| # | Ürün | ~USD/yıl | Karar |
|---|---|---:|---|
| ✔ | **Cloudflare Business** (3 alan adı: web, mobil API, LMS) | 7.200 | Uçta WAF, L7 DDoS, bot koruması ve rate limit; saldırı trafiği hattımıza girmeden düşüyor |
| 2 | ModSecurity v3 + OWASP CRS | 0 (lisans) | **Orijinde ikinci katman olarak kullanılıyor**; tek başına DDoS koruması yok |
| 3 | FortiWeb 400F | ~20.200 | Cihaz; volümetrik saldırıyı hatta girmeden durduramaz |
| 4 | Imperva Cloud WAF | ~12.000 | Benzer yetenek, daha pahalı |
| 5 | F5 BIG-IP Advanced WAF VE | ~15.000 | Güçlü ama pahalı ve öğrenmesi zor |

### Londra: perimeter (200 Mbps)

| # | Ürün | TP (Gbps) | ~USD | Karar |
|---|---|---:|---:|---|
| ✔ | **FortiGate 60F** HA | 0,7 ᵇ | 2.600 | Hattın 3,5 katı, filo standardı |
| 2 | Sophos XGS 136 | 1,0 ᵇ | 3.400 | İkinci konsol |
| 3 | Netgate 4200 | ~1,0 ᵗ | 1.400 | IPS değeri yok, UK'de yerinde destek yok |
| 4 | WatchGuard Firebox T85 | ~1,1 ᵗ | 3.800 | Yıllık lisansı yüksek |
| 5 | Palo Alto PA-440 | ~1,0 ᵗ | 5.800 | 48 kişi için pahalı |

### Akademik kampüs: perimeter (10 Gbps)

| # | Ürün | TP (Gbps) | ~USD | Karar |
|---|---|---:|---:|---|
| ✔ | **FortiGate 900G** HA | 20 ᵇ | 120.000 | Hattın 2 katı; S2 tepesinde IPS kapatılmıyor; 16 milyon oturum |
| 2 | Sophos XGS 6500 | 17 ᵇ | 70.000 | Yakın ve ucuz ama 10 bin kullanıcılık referansımız yok |
| 3 | Check Point Quantum Force 9300 | 10,5 ᶜ | 60.000 | Hattın tam eşiğinde; tepe yükte IPS kapatılmak zorunda kalınır |
| 4 | Palo Alto PA-5410 | ~35 ᵇ | 250.000 | Fazla kapasite, 2 kattan fazla fiyat |
| 5 | OPNsense DEC4200 serisi | ~5 ᵗ | 10.000 | 10 Gbps'te IPS kanıtı yok |

### Veri merkezi: iç segmentasyon (doğu-batı, 5 Gbps)

| # | Ürün | TP (Gbps) | ~USD | Karar |
|---|---|---:|---:|---|
| ✔ | **FortiGate 200G** HA | 6 ᵇ | 30.000 | Hub ile aynı model: yedek parça ve bilgi ortak |
| 2 | Palo Alto PA-3440 | 11 ᵇ | 70.000 | Pahalı |
| 3 | Check Point Quantum Force 9300 | 10,5 ᶜ | 60.000 | Pahalı, deneyim yok |
| 4 | Netgate 8200 | 18,5 (IPS kapalı) | 3.300 | İç segmentte de IPS istiyoruz |
| 5 | OPNsense DEC4200 serisi | ~5 ᵗ | 10.000 | HA ve destek zayıf |

ᵇ bayi veya distribütör sayfası (resmi datasheet ile doğrulanmalı) · ᶜ Check Point resmi karşılaştırma sayfası ·
ᵗ bizim tahminimiz, satıcı değeri yok

**Toplam donanım + 1. yıl:** ≈ 194.000 USD. Bunun %62'si kampüs kenarı; firewall bütçesinin büyük kısmı 10.000 öğrenciye gidiyor.

## 5. Uzaktan erişim ve izleme

### Neden public SSH yok

İnternete açık bir 22 portu dakikalar içinde taranır ve kaba kuvvet saldırısı alır. Bizde **hiçbir kenarda 22 dışarıya açık
değil.** Yönetim yolu şöyle:

> Yönetici → FortiClient IPsec IKEv2 (İstanbul hub, Ankara yedek) → **MFA** (Entra ID/AD grubu, RADIUS üzerinden) →
> ADMIN rol havuzu `10.20.200.0/24` → yalnız **bastion** (`10.50.15.0/24`, oturum kaydı) → SSH/HTTPS ile MGMT VLAN'ları.

Roller ayrı adres havuzlarına düşer ve her havuz yalnız kendi hedefine gidebilir:

| VPN rolü | Havuz | Gidebildiği yer |
|---|---|---|
| ADMIN | `10.20.200.0/24` | Bastion |
| DEV | `10.20.201.0/24` | git/CI/artefakt |
| RND | `10.20.202.0/24` | Araştırma veri deposu |
| STAFF | `10.20.204.0/22` | ERP, posta, intranet |

VPN profillerini Ağ Yöneticisi dağıtır ve yönetir. İşten ayrılan birinin erişimi, AD grubundan çıkarılmasıyla anında kapanır.
SSL-VPN kapalı, çünkü FortiOS SSL-VPN'in istismar edilmiş CVE geçmişi var. Yönetici girişinde FortiCloud SSO da kapalı (bkz. §6).

### Kim izliyor, kim sorumlu

| Konu | Araç | Sahibi | Kanal |
|---|---|---|---|
| **Güvenlik:** blok, auth hatası, IPS/WAF isabeti, yeni dinleyen port | Wazuh SIEM + FortiAnalyzer | **Güvenlik Analisti** (SOC sorumlusu); mesai dışı haftalık nöbet; eskalasyon BT ve Ağ Operasyonları Müdürü | Önem 3+: Telegram `soc-alerts` + nöbetçiye telefon |
| **Uygulama sağlığı:** ERP/LMS erişilebilirliği, CPU, p95 hat doluluğu %70 üstü | Zabbix + Grafana | **Sistem Yöneticisi** | e-posta + ayrı Telegram `ops-health` |
| **Kural değişikliği** | FortiManager + değişiklik kaydı | **Ağ Yöneticisi** | CAB onayı, kural başına gerekçe |

İki hat bilerek ayrıldı: uptime gürültüsü saldırı uyarısını gömmesin. Telegram botunun profili derste gördüğümüz hatadan
ders alınarak ayarlandı. Bot **yalnız BLOCK** ve **yalnız inbound** olayları bildiriyor ve 5 dakikalık özet/dedup yapıyor.
Giden ALLOW ve DNS olaylarını bildirmiyor, yoksa bot kendi trafiğini bildirip rate limit'e takılır.
Bot token'ı yalnız sır kasasında tutuluyor; sızarsa hemen değiştirilir.

**Log saklama:** Güvenlik ve erişim logları **2 yıl** tutuluyor (5651 sayılı kanun 1-2 yıl arası saklama istiyor; süre
dolunca KVKK imha politikası uygulanıyor). Son 90 gün sıcak depoda, sonrası hash'li ve imzalı arşivde. Londra logları
**UK GDPR** gereği kişisel veri azaltılarak ve IDTA sözleşmesiyle Türkiye'deki SIEM'e aktarılıyor.

**Yedek ve yama:** Firewall'lar FortiManager'a kendileri bağlanıyor (giden FGFM 541); config sürümleri orada tutuluyor ve her gece aynı VLAN'daki yedekleme sunucusuna aktarılıyor, ayrıca şifreli bir harici kopya tutuluyor.
Ayda bir geri yükleme testi yapılıyor. Firmware dahil yamalar aylık bakım penceresinde uygulanıyor; kritik bir CVE çıkarsa
72 saat içinde. HA çiftlerinde önce pasif üye güncelleniyor. FortiGuard PSIRT ve CISA KEV takip ediliyor.

## 6. CVE takibi (bonus)

**CVE-2026-24858: FortiOS FortiCloud SSO kimlik doğrulama atlatma** (FG-IR-26-060, CISA KEV listesinde). 2026 Ocak'ta
aktif olarak istismar edildi: saldırganlar arka kapı yönetici hesabı açtı ve firewall config'ini değiştirdi. Bütün
filomuz FortiGate olduğu için doğrudan bizi ilgilendiriyor.

- **Geçici önlem:** `admin-forticloud-sso-login` devre dışı bırakıldı. Yönetim arayüzü tasarım gereği zaten WAN'a kapalı,
  yalnız bastion'dan erişiliyor. Yeni bir yönetici hesabı açıldığında SIEM uyarı üretiyor.
- **Kalıcı çözüm:** Sabit FortiOS sürümüne yükseltme. HA çiftinde önce pasif üye güncelleniyor, bakım penceresinde.
- **Durum:** `patched`.

**CVE-2024-4577: PHP-CGI argüman enjeksiyonu (RCE).** Derste işlenen PHP RCE dersinin bizim tasarımdaki karşılığı. Açık
yalnız Windows'ta CGI modunu etkiliyor. Bizim LMS ve web sitesi Linux üzerinde PHP-FPM ile çalıştığı için
**etkilenmiyoruz** (`not-affected`). Yine de geçici katman olarak Cloudflare'in yönetilen WAF kuralı ve ModSecurity CRS
açık. Kalıcı çözüm, PHP sürümlerinin aylık yama penceresinde güncel tutulması. **Firewall burada doğru katman değil:**
saldırı izinli 443 portundan geliyor. Bu iş WAF'ın ve yamanın işi.

## 7. Bilerek yapmadıklarımız

- **Tam mesh VPN yok.** İstanbul hub-and-spoke yapısı 3 tünel demek; mesh 6 tünel ve 6 politika demek. Hub'ın tek nokta
  riskini HA çifti ve çift ISP azaltıyor. Ankara ikinci VPN sonlandırıcısı olarak bekliyor.
- **Kampüs için ikinci bir iç firewall yok.** Öğrenci ↔ iç ağ ayrımını 900G yapıyor, öğrenciler arası trafiği AP'deki
  client isolation kesiyor. Ayrı bir iç segmentasyon firewall'u 60.000 USD'nin üstünde bir ek maliyet; bugünkü risk bunu karşılamıyor.
- **SSL-VPN yok.** Uzaktan erişim IKEv2 ile yapılıyor; FortiClient ve MFA entegrasyonu hazır.

## 8. Kaynaklar

- Fortinet, bayi datasheet özetleri: [FortiGate 200F/80F/60F](https://www.boll-europe.at/datasheets/Fortinet_Product_Matrix.pdf),
  [FortiGate 200G](https://datacenter360.ca/fortinet/fortigate/fortigate-200g-firewall/),
  [FortiGate 900G](https://cdwg.com/product/fortinet-fortigate-900g-security-appliance-with-3-years-forticare-premi/7508762),
  [200F sipariş sonu notu](https://datacenter360.ca/fortinet/fortigate/fortigate-200f-firewall/)
- [Check Point güvenlik cihazları karşılaştırması](https://www.checkpoint.com/check-point-security-appliances-comparison)
- [Palo Alto PA-450](https://paloguard.com/firewall-pa-450.asp), [PA-3440](https://networkdevicesinc.com/collections/pa-3400-series-firewalls/products/pan-pa-3440), [karşılaştırma](https://paloguard.com/compare-spec.asp)
- [Sophos XGS](https://firewalls.com/brands/sophos/firewalls/xgs-firewalls.html), [XGS 2300](https://cdwg.com/product/sophos-xgs-2300-security-appliance/6535228)
- [Netgate 8200 duyurusu](https://www.netgate.com/blog/announcing-the-netgate-8200), [mağaza](https://shop.netgate.com/products/8200-max-pfsense)
- [FortiWeb 400F](https://www.shi.com/product/47678528/Fortinet-FortiWeb-400F), [Cloudflare planları](https://www.cloudflare.com/plans/)
- [CVE-2026-24858](https://cvefeed.io/vuln/detail/CVE-2026-24858), [HivePro analizi](https://www.hivepro.com/threat-advisory/cve-2026-24858-critical-forticloud-sso-zero-day-under-active-exploitation/)
- Dokümantasyon deposu: [RedRiveRR/guvenlik-duvari-projesi](https://github.com/RedRiveRR/guvenlik-duvari-projesi), K1-K21 kaynak listesi: [kaynaklar-ve-referanslar.md](https://github.com/RedRiveRR/guvenlik-duvari-projesi/blob/main/arastirma/kaynaklar-ve-referanslar.md)
