# GüvenTek Bilişim A.Ş.

> Contributed by `G*** Ş***` ([@GvnTech-cmd](https://github.com/GvnTech-cmd)) · BGT207 Güvenlik Duvarı Çözümleri · 2026-2027 Güz midterm project.
> Student names are masked on purpose. Converted from the student's Turkish README and notes. The original names one FortiGate per site without alternatives, so the other four products per segment are reviewer-added comparison points.

Bu proje, GüvenTek Bilişim A.Ş.'nin 3 farklı lokasyonundaki (İstanbul, Ankara, İzmir) ağ altyapısının güvenliğini, VLAN segmentasyonunu ve bant genişliği ihtiyaçlarını planlamak amacıyla hazırlanmıştır.

## 1. Senaryo: GüvenTek Bilişim A.Ş.

GüvenTek Bilişim, 3 farklı ofiste toplam 370 çalışanı ile faaliyet gösteren bir teknoloji firmasıdır. Amacımız; ofislerin ihtiyaç duyduğu bant genişliğini hesaplamak, ağları VLAN'lar ile birbirinden izole etmek ve uygun Güvenlik Duvarı (Firewall) cihazlarını konumlandırmaktır.

| Ofis | Lokasyon | Kullanıcı Sayısı | Açıklama |
| --- | --- | --- | --- |
| Merkez Ofis | İstanbul | 200 Personel | Şirket yönetimi, İK, finans ve ana veri merkezi buradadır. |
| Operasyon Şubesi | Ankara | 100 Personel | Satış, saha operasyonları ve teknik destek ekibi. |
| Ar-Ge ve Yazılım | İzmir | 70 Personel | Yazılım geliştiriciler; yüksek bant genişliği ve test sunucuları. |

Tüm ofisler internete kendi üzerinden çıkar ve birbirlerine IPsec VPN ile bağlıdır. 

## 2. Ağ Topolojisi ve VLAN Planı

Güvenlik prensipleri gereği her ofise kendi `/16` IP bloğu atanmış ve içerideki departmanlar VLAN'lar ile ayrılmıştır.

| Lokasyon | IP Bloğu | VLAN ID | Ağ | Kullanım Amacı |
| --- | --- | --- | --- | --- |
| İstanbul (Merkez) | 10.10.0.0/16 | 10 | 10.10.10.0/24 | Yönetim ve İdari Personel |
| İstanbul (Merkez) | | 20 | 10.10.20.0/24 | IT ve Güvenlik Ekibi |
| İstanbul (Merkez) | | 30 | 10.10.30.0/24 | Sunucular (ERP, Mail, Veritabanı) |
| Ankara (Şube) | 10.20.0.0/16 | 10 | 10.20.10.0/24 | Satış ve Operasyon Personeli |
| Ankara (Şube) | | 20 | 10.20.20.0/24 | Teknik Destek Ekibi |
| İzmir (Ar-Ge) | 10.30.0.0/16 | 10 | 10.30.10.0/24 | Yazılım ve Ar-Ge Ekibi |
| Tüm Ofisler | | 99 | 192.168.99.0/24 | Misafir Ağı (Sadece İnternet) |

## 3. Bant Genişliği ve Firewall Seçim Matrisi

Hız hesaplamaları şu formüle göre yapılmıştır: `Toplam Hız = (Kullanıcı Sayısı × Eşzamanlılık Oranı × Kişi Başı Ortalama Hız) × 1.25`

*   **İstanbul:** 200 kişi × %70 × 2 Mbps × 1.25 = ~350 Mbps
*   **Ankara:** 100 kişi × %70 × 2 Mbps × 1.25 = ~175 Mbps
*   **İzmir (Yazılımcılar):** 70 kişi × %90 × 10 Mbps × 1.25 = ~787 Mbps

Bu hesaplamalara göre Firewall kapasiteleri ve modelleri aşağıdaki matriste belirlenmiştir:

| Ofis | İdari Personel | Yazılım (Ar-Ge) | Teknik Destek | IT / Güvenlik | Toplam Kişi | Gereksinim (Formül) | Ana İnternet Hattı | Seçilen Firewall (NGFW) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **İstanbul Merkez** | 150 | 0 | 0 | 50 | **200** | 350 Mbps | 500 Mbps Fiber | **FortiGate 100F (HA)** |
| **Ankara Şube** | 80 | 0 | 20 | 0 | **100** | 175 Mbps | 200 Mbps Fiber | **FortiGate 60F** |
| **İzmir Ar-Ge** | 0 | 70 | 0 | 0 | **70** | 787 Mbps | 1 Gbps Fiber | **FortiGate 200F** |
| **TOPLAM** | **230** | **70** | **20** | **50** | **370** | **1.3 Gbps** | **1.7 Gbps** | |

## 4. Temel Güvenlik Kuralları ve İzleme

Ağ güvenliği "Default Deny" (Varsayılan olarak her şeyi yasakla) mantığı ile kurulmuştur.

*   **VLAN İzolasyonu:** Misafir ağı (VLAN 99) hiçbir şirket içi sunucuya erişemez, sadece internete çıkabilir.
*   **İnternet Çıkışları:** Ar-Ge ekibi dışındaki personelin torrent, P2P ve yasadışı sitelere girişi Firewall üzerindeki "Web Filter" ve "Application Control" ile engellenmiştir.
*   **İzleme (Monitoring):** Tüm şubelerdeki FortiGate cihazlarının logları, İstanbul Merkez ofisteki merkezi bir Log/SIEM (örneğin FortiAnalyzer) sunucusuna gönderilir. CPU kullanımı %80'i geçerse veya VPN bağlantıları koparsa IT ekibine otomatik e-posta alarmı gider.

# İzleme ve Yönetim (Monitoring)

Sistemimizin takibi iki koldan yapılmaktadır:

*   **Sistematik Kısım:** Tüm ofislerdeki FortiGate cihazları, loglarını İstanbul Merkez ofisteki FortiAnalyzer (SIEM) sunucusuna gönderir. CPU kullanımı %80'i aştığında, VPN tünelleri koptuğunda veya kritik bir IPS kuralı tetiklendiğinde sistem otomatik olarak e-posta alarmı üretir.
*   **İnsan Kısmı:** Mesai saatleri içinde (09:00 - 18:00) İstanbul Merkez ofisteki IT ve Güvenlik Ekibi NOC/SOC ekranlarından (Grafana vb.) anlık ağ trafiğini izler. Mesai dışı kritik alarmlar için nöbetçi IT personeline SMS bildirimi gider.

# Riskler ve Koruma Stratejisi

Ağımızda bulunan ofislerde neleri, neden ve nasıl koruyoruz?

*   **İstanbul Merkez:** Şirketin ana ERP, veritabanı ve Mail sunucuları buradadır.
    *   *Neden koruyoruz:* Şirketin kalbi olduğu için veri sızıntısı veya çökme büyük maddi kayba yol açar.
    *   *Nasıl koruyoruz:* Sunucular ayrı bir VLAN'a (30) alınmış ve dışarıdan gelen trafiğe karşı IPS (Saldırı Önleme Sistemi) aktif edilmiştir.
*   **Ankara Şube:** Satış ve saha operasyon verileri işlenir.
    *   *Neden koruyoruz:* Cihazlara fiziksel müdahale veya misafir cihazların ağa dahil olma riski vardır.
    *   *Nasıl koruyoruz:* Kullanılmayan switch portları kapatılmış ve MAC filtreleme yapılmıştır.
*   **İzmir Ar-Ge:** Şirketin tüm yazılım kaynak kodları buradadır.
    *   *Neden koruyoruz:* Fikri mülkiyetin çalınması (kod sızıntısı) en büyük risktir.
    *   *Nasıl koruyoruz:* Ar-Ge VLAN'ı (10) tamamen izole edilmiştir. Merkez ofisteki yönetim ekibi dahil kimse Ar-Ge ağına dışarıdan erişemez, veri çıkışı sıkı kurallara (DLP) tabidir.

# Senaryolar ve Olay Müdahalesi

Ağımızda yaşanabilecek muhtemel olaylar ve sistemin vereceği tepkiler:

1. **Senaryo 1 (Zararlı Yazılım):** Bir personel oltalama (phishing) e-postasına tıklayıp zararlı dosya indirirse, Firewall üzerindeki Antivirüs profili devreye girer ve indirmeyi durdurur.
2. **Senaryo 2 (İzinsiz Erişim):** Misafir ağındaki (VLAN 99) biri şirket sunucularına girmeye çalışırsa, aradaki "Default Deny" kuralı gereği paket anında düşürülür (drop) ve IT ekibine log düşer.
3. **Senaryo 3 (Cihaz Arızası):** İstanbul Merkez'deki ana FortiGate cihazı (Primary) arızalanırsa, High Availability (HA) yapısı sayesinde yedek cihaz (Secondary) saniyeler içinde devreye girer ve ağ kesintisi yaşanmaz.
