

## Ankara Üniversitesi Tıp Fakültesi Hastaneleri Otomatik Web Randevu Botu
- Bu bot Ankara Üniversitesi'nin hiçbir API veya açığını kullanmaz. Her şey Node.JS modulü olan `puppeteer` kullanılarak randevu alınmaya çalışılır. Normal bir insan nasıl randevu alıyorsa bu bot da aynı şekilde randevu almaya çalışmaktadır.
- Botun normal bir insandan tek farkı, 7/24 aktif bir şekilde her `N` dakikada bir (varsayılan: 30dk) randevu almaya çalışmasıdır.
- Tüm işlemler Telegram veya Konsola kayıt edilmektedir.


## Kullanım

- Botu kullanmak için önerilen Node.JS sürümü `>14.0`

- Botu kullanmaya başlamadan önce, `config.json` dosyasında bazı düzenlemeler yapmalısınız. Gerekli alanları doğru bir şekilde doldurunuz. Telegram tokenini doldurmanız zorunlu değildir ama telegram botu kullanmanız önerilir.
- Eğer `randevu_bulununca_kapat` seçeneği `false` durumunda ise bot size herhangi bir tarih veya saat sormaz. Rastgele bir tarihin rastgele bir saatini seçer, daha sonra ekran görüntüsünü ve sayfanın PDF'ini telegramdan gönderir.
```json
{
	"tc": "TC Kimlik numaranızı buraya yazınız",
	"sifre": "Şifrenizi buraya yazınız",
	"istenilen_bolum": 17, // Bölüm numaraları aşağıdadır
	"deneme_araligi_dk": 30,
	"islem_araligi_sn": 2.5,
	"randevu_bulununca_kapat": true,
	"telegram_token": "Telegram botunuzun tokenini buraya yazınız",
	"telegram_sohbet_id": 0,
	"debug": 0,
	"bolumler": ["...Bir Sürü Veri..."]
}
```

- **Dikkat!** `config.json` içerisinde bulunan `bolumler` kısmıyla kesinlikle oynamayınız!
- **Dikkat!** Seçilen bölümde birden fazla poliklinik olsa bile bot her zaman ilk polikliniği seçecektir! Diğer polikliniklerin seçimi için `index.js`içerisinde bulunan `Poliklinik Seçimi` yorumu altıdna bulunan kodu düzenleyebilirsiniz. (`index 0 'Seçiniz' yazısına denk gelmektedir o yüzden 1. poliklinik index 1'e, n. poliklinik index n'e denk gelmektedir`)

### Başlatma
- Botun `package.json` dosyasının olduğu dizinde bir komut konsolu oluşturun.
- **Dikkat!** Botu ilk kez başlatıyorsanız öncelikle `npm install` komudunu konsola giriniz ve gerekli modüllerin yüklenmesini bekleyiniz.
- Botu normal bir şekilde başlatmak için konsola `npm start` veya `node index.js` yazabilirsiniz. Bir süre sonra botunuz aktifleşecek ve konsola veya telegrama günlük tutmaya başlayacaktır.
#### Bölüm Numaraları
| Bölüm Numarası | Bölüm |
|---|---|
|0 | Algoloji -> Anesteziyoloji ve Reanimasyon(  Ibni Sina Hastanesi )|
|1 | Beyin ve Sinir Cerrahisi(  Ibni Sina Hastanesi )|
|2 | Çocuk Cerrahisi -> Çocuk Ürolojisi( Cebeci )|
|3 | Çocuk Cerrahisi (Ana Brans)( Cebeci )|
|4 | Çocuk Sagligi ve Hastaliklari (Ana Brans)( Cebeci )|
|5 | Dermatoloji(  Ibni Sina Hastanesi )|
|6 | El Cerrahisi(Ortopedi ve Travmatoloji)(  Ibni Sina Hastanesi )|
|7 | Enfeksiyon Hastaliklari(  Ibni Sina Hastanesi )|
|8 | Fiziksel Tip ve Rehabilitasyon -> Romatoloji(Fizik Tedavi)(  Ibni Sina Hastanesi )|
|9 | Fiziksel Tip ve Rehabilitasyon (Ana Brans)(  Ibni Sina Hastanesi )|
|10 | Fiziksel Tip ve Rehabilitasyon (Ana Brans)( Cebeci )|
|11 | Genel Cerrahi (Ana Brans)(  Ibni Sina Hastanesi )|
|12 | Genel Cerrahi (Ana Brans)(  Ibni Sina Hastanesi )|
|13 | Genel Cerrahi (Ana Brans)( Cebeci )|
|14 | Gögüs Cerrahisi(  Ibni Sina Hastanesi )|
|15 | Gögüs Hastaliklari -> Alerjik Gögüs Hastaliklari( Cebeci )|
|16 | Gögüs Hastaliklari (Ana Brans)( Cebeci )|
|17 | Göz Hastaliklari( Cebeci )|
|18 | Iç Hastaliklari -> Endokrinoloji ve Metabolizma Hastaliklari(  Ibni Sina Hastanesi )|
|19 | Iç Hastaliklari -> Gastroenteroloji(  Ibni Sina Hastanesi )|
|20 | Iç Hastaliklari -> Gastroenteroloji( Cebeci )|
|21 | Iç Hastaliklari -> Geriatri(  Ibni Sina Hastanesi )|
|22 | Iç Hastaliklari -> Hematoloji( Cebeci )|
|23 | Iç Hastaliklari -> Immünoloji ve Alerji Hastalıkları(  Ibni Sina Hastanesi )|
|24 | Iç Hastaliklari -> Nefroloji(  Ibni Sina Hastanesi )|
|25 | Iç Hastaliklari -> Romatoloji(  Ibni Sina Hastanesi )|
|26 | Iç Hastaliklari (Ana Brans)(  Ibni Sina Hastanesi )|
|27 | Kadin Hastaliklari ve Dogum (Ana Brans)( Cebeci )|
|28 | Kalp ve Damar Cerrahisi (Ana Brans)( Cebeci )|
|29 | Kardiyoloji (Ana Brans)(  Ibni Sina Hastanesi )|
|30 | Kardiyoloji (Ana Brans)( Cebeci )|
|31 | Kulak-Burun-Bogaz Hastaliklari(  Ibni Sina Hastanesi )|
|32 | Kulak-Burun-Bogaz Hastaliklari( Cebeci )|
|33 | Nöroloji(  Ibni Sina Hastanesi )|
|34 | Ortopedi ve Travmatoloji(  Ibni Sina Hastanesi )|
|35 | Plastik, Rekonstrüktif ve Estetik Cerrahi (Ana Brans)( Cebeci )|
|36 | Psikiyatri( Cebeci )|
|37 | Üroloji -> Çocuk Ürolojisi( Cebeci )|