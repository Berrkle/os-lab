# Kurumsal Ağ Güvenliği ve Altyapı Planlaması

> Contributed by `F*** Y*** A***` ([@fatmayelizapaydin](https://github.com/fatmayelizapaydin)) · BGT207 Güvenlik Duvarı Çözümleri · 2026-2027 Güz midterm project.
> Student names are masked on purpose. Converted from the student's Turkish documents (model-citation artefacts removed). The original gives VLAN numbers and roles but no CIDRs; the CIDRs in `company.json` are reviewer placeholders.

# Proje özeti

Bu proje; çokuluslu ve akademik operasyonlar yürüten hayali bir kurumun ağ güvenliği mimarisini, bant genişliği kapasite planlamasını ve Yeni Nesil Güvenlik Duvarı (NGFW) entegrasyonunu standartlaştırmak amacıyla tasarlanmıştır. Kurum; İstanbul, Ankara ve Londra ofisleri ile yüksek trafikli bir Akademik Şube, Yazılım Ekibi ve Ar-Ge biriminden oluşmaktadır.

## Proje Kapsamı ve Matris Tablosu
Her şubenin kullanıcı profili analiz edilerek hesaplanan bant genişliği gereksinimleri ve seçilen Yüksek Erişilebilirlik (HA) mimarisine sahip FortiGate NGFW modelleri aşağıda yer almaktadır:

| Branch (Şube) | Admin Staff | Faculty | Students | Software | Technical | Security | R&D | Total (Toplam) | Required Bandwidth | Primary + Backup Link | Selected NGFW (HA) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Istanbul Office** | 280 | 0 | 0 | 60 | 35 | 25 | 20 | 420 | 3.95 Gbps | 5 + 5 Gbps | FortiGate 400F |
| **Ankara Office** | 140 | 0 | 0 | 30 | 20 | 15 | 15 | 220 | 1.50 Gbps | 2 + 1 Gbps | FortiGate 200F |
| **London Office** | 125 | 0 | 0 | 30 | 18 | 16 | 12 | 210 | 1.35 Gbps | 2 + 1 Gbps | FortiGate 200F |
| **Academic Branch** | 220 | 400 | 10,000 | 30 | 60 | 0 | 40 | 10,750 | 27.09 Gbps | 30 + 10 Gbps | FortiGate 3500F |
| **Total (Toplam)** | **775** | **400** | **10,000** | **150** | **133** | **55** | **67** | **11,600** | **34.00 Gbps** | **39 + 17 Gbps** | - |


# Şube detayları ve Top 5 firewall

Bu doküman; İstanbul, Ankara, Londra ofisleri ile Akademik Şube, Yazılım ve Ar-Ge birimlerinin kişi sayılarına göre bant genişliği tahminlerini, top 5 güvenlik duvarı önerilerini ve şube özelindeki kural setlerini içerir.

## 1. Ankara Ofisi (220 Çalışan)
* **Bant Genişliği İhtiyacı:** 1.50 Gbps (2 + 1 Gbps Hat)
* **Top 5 Firewall Adayları:** 
  1. Fortinet FortiGate 200F (Seçilen Model - Optimum Fiyat/Performans)
  2. Palo Alto Networks PA-3220
  3. Cisco Firepower 2130
  4. Check Point Security Gateway 1550
  5. SonicWall NSA 6700
* **Kural Setleri:** İdari ve teknik personel için Web Filtering aktif, yönetim ağına sadece içeriden yetkili erişim, varsayılan olarak her şeyin engellenmesi (Default Deny).

## 2. İstanbul Ofisi (420 Çalışan)
* **Bant Genişliği İhtiyacı:** 3.95 Gbps (5 + 5 Gbps Hat)
* **Top 5 Firewall Adayları:**
  1. Fortinet FortiGate 400F (Seçilen Model - Yüksek UTM Kapasitesi)
  2. Palo Alto Networks PA-5220
  3. Cisco Firepower 4110
  4. Check Point Security Gateway 3200
  5. Juniper SRX 4600
* **Kural Setleri:** Yoğun kurumsal trafik için SSL Inspection ve Application Control kuralları aktif edilmiştir.

## 3. Londra Ofisi (210 Çalışan)
* **Bant Genişliği İhtiyacı:** 1.35 Gbps (2 + 1 Gbps Hat)
* **Top 5 Firewall Adayları:**
  1. Fortinet FortiGate 200F (Seçilen Model)
  2. Palo Alto Networks PA-3220
  3. Cisco Firepower 2130
  4. Check Point Security Gateway 1550
  5. SonicWall NSA 6700
* **Kural Setleri:** Uluslararası koordinasyon ve güvenli VPN tünelleri için özel kural setleri.

## 4. Akademik Şube (10,750 Kullanıcı - 10,000 Öğrenci)
* **Bant Genişliği İhtiyacı:** 27.09 Gbps (30 + 10 Gbps Hat)
* **Top 5 Firewall Adayları:**
  1. Fortinet FortiGate 3500F (Seçilen Model - Çok Yüksek Throughput)
  2. Palo Alto Networks PA-7050
  3. Cisco Firepower 9300
  4. Check Point 65000 Security System
  5. Juniper SRX 5800
* **Kural Setleri:** Öğrenci VLAN'larında Rate Limiting (Bant Genişliği Sınırlaması) ve P2P/Torrent trafik engelleme kuralları.
*


# Ortak kurulum adımları

Bu doküman, kurumun tüm ofis ve şubelerinde standart ve güvenli bir ağ mimarisi kurmak için izlenecek temel adımları tanımlar.

## 1. Fiziksel ve Mantıksal Konumlandırma
* **Konum:** Tüm şubelerde Next-Generation Firewall (NGFW) cihazları, ana internet çıkışı (ISP) ile dahili ağ (LAN) arasına konumlandırılacaktır.
* **Yüksek Erişilebilirlik (HA):** Trafik sürekliliği ve donanım arızalarına karşı tüm şubelerde aktif-pasif veya aktif-aktif **HA (High Availability)** mimarisi zorunludur.

## 2. Ağ Segmentasyonu (VLAN Yapılandırması)
Ağ güvenliğini artırmak ve yetkisiz erişimleri önlemek amacıyla şubeler aşağıdaki mantıksal alt ağlara (VLAN) bölünecektir:
* **VLAN 10 - Yönetim (Management):** Sadece IT ve güvenlik ekiplerinin erişebileceği yönetim ağı.
* **VLAN 20 - Personel / İdari:** İdari personel ve akademisyenlerin kullandığı kurumsal ağ.
* **VLAN 30 - Öğrenci / Misafir (Guest):** Akademik şubede öğrencilerin izole şekilde internete çıkacağı kısıtlı ağ.
* **VLAN 40 - Sunucu / Ar-Ge / Yazılım:** Kritik sunucuların, test ortamlarının ve geliştirme projelerinin barındırıldığı güvenli bölge.

## 3. Temel Güvenlik İlkeleri (Security Policies)
* **Default Deny (Varsayılan Reddet):** Kurallar tablosunun en altında tüm trafik (Implicit Deny) engellenecektir.
* **IPS ve Antivirüs:** Tüm güvenlik duvarlarında IDS/IPS (Saldırı Önleme Sistemleri) ve antivirüs motorları aktif hale getirilecektir.
*


# Riskler

Bu doküman, kurumun tüm ofislerinde ve şubelerinde karşılaşılması muhtemel siber güvenlik risklerini, ağ kesintisi tehditlerini ve bunlara karşı alınacak proaktif önlemleri tanımlar.

## 1. Olası Riskler ve Tehdit Senaryoları
* **Bant Genişliği Darboğazı (Bottleneck):** Özellikle Akademik Şube'deki 10.000 öğrencinin yoğun internet kullanımı sırasında hatların doygunluğa ulaşması ve kritik iş süreçlerinin yavaşlaması.
* **Yetkisiz Erişim ve İç Tehditler (Insider Threats):** Personel veya öğrenci VLAN'larından yönetim ağına (Management) sızma denemeleri.
* **Donanım Arızası ve Kesinti:** Güvenlik duvarı (NGFW) cihazlarında yaşanabilecek ani donanım arızalarında tüm şube trafiğinin kesilmesi riski.
* **DDoS ve Botnet Saldırıları:** Kurumun dış dünya ile olan ana hatlarına gelebilecek hacimsel saldırılar.

## 2. Proaktif Korunma ve Mitigasyon Stratejileri
* **Yüksek Erişilebilirlik (HA):** Tüm şubelerde ana ve yedek hatlar ile HA mimarisine sahip FortiGate cihazları kullanılarak kesinti riski minimuma indirilecektir.
* **Katı Ağ Segmentasyonu:** VLAN yapılandırmaları sayesinde kullanıcılar ile kritik sunucular tamamen izole edilecektir.
* **Trafik Şekillendirme (Traffic Shaping):** Akademik şubede öğrenci ağındaki p2p ve video akış trafiğine bant genişliği sınırlamaları (Rate Limiting) uygulanacaktır.
*


# İzleme

Bu doküman, kurumun tüm ofis ve şubelerindeki ağ trafiğinin, güvenlik duvarlarının (NGFW) ve sistem sağlığının izlenmesi için hem teknik (sistematik) hem de operasyonel (insani) süreçleri tanımlar.

## 1. Sistematik İzleme (Teknik ve Otomatik Altyapı)
Sistemlerin 7/72 kesintisiz izlenebilmesi ve anlık tehdit tespiti için şu teknik araçlar ve protokoller kullanılacaktır:
* **SIEM ve Log Yönetimi:** Tüm FortiGate güvenlik duvarlarından gelen loglar merkezi bir SIEM (Security Information and Event Management) sistemine Syslog protokolü ile aktarılacaktır.
* **SNMP ve Ağ İzleme:** Ağ cihazlarının CPU, RAM, arayüz (interface) durumları ve bant genişliği doluluk oranları SNMP v3 ve Zabbix/Grafana araçlarıyla anlık olarak izlenecektir.
* **Alert (Alarm) Mekanizmaları:** Bant genişliği %85'i geçtiğinde veya kritik bir güvenlik duvarı kuralı tetiklendiğinde IT güvenlik ekibine otomatik e-posta ve SMS uyarıları gönderilecektir.

## 2. İnsani İzleme (Operasyonel Süreçler ve İnsan Faktörü)
Profesyonel dünyada sadece yazılımlara güvenilmez; insan denetimi ve süreç yönetimi kritik rol oynar:
* **SOC (Security Operations Center) Ekibi:** 7/24 vardiyalı çalışan güvenlik analistleri, SIEM üzerine düşen anomalileri ve kritik uyarıları canlı olarak inceler.
* **Günlük Kontroller ve Raporlama:** Sabah vardiyası değişimlerinde önceki geceye ait güvenlik olayları (firewall bloklamaları, başarısız oturum açma denemeleri) manuel olarak gözden geçirilir.
* **Yetki ve Sorumluluk Matrisi (RACI):** Olay müdahale (Incident Response) süreçlerinde kimin haberdar edileceği, hangi birimin müdahale edeceği net bir şekilde tanımlanmıştır.
*
