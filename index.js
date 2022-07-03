const puppeteer = require('puppeteer');
const { Telegraf, Scenes, Markup } = require('telegraf')
const fs = require('fs');
const { tmpdir } = require('os');
(async () => {
    let config = require("./config.json");
    let randevu_secimi_durumu = false;
    async function writeJson(file, data) {
        await fs.writeFileSync(file, JSON.stringify(data, null, 4));
    }
    const tBot = new Telegraf(config.telegram_token)
    if (!config.telegram_sohbet_id) {
        console.log("[ ÖNEMLİ ] Telegram botunun size bilgilendirme yapabilmesi için lütfen telegramdan bota herhangi bir mesaj yazınız.")
        tBot.start(ctx => ctx.reply("[ BİLGİLENDİRME ] Bot tarafından kaydedildin! Artık tüm mesajlar bu hesaba gönderilecek."))
        tBot.on("text", async ctx => {
            if (!config.telegram_sohbet_id) {
                config.telegram_sohbet_id = ctx.message.chat.id
                await writeJson("./config.json", config);
                console.log("[ BAŞARILI ] Telegram botu " + ctx.message.chat.id + " ID'li sohbet ile bağlandı!")
                ctx.reply("[ BAŞARILI ] Artık tüm bilgilendirmeler buraya yapılacak.")
            } else {
                return;
            }
        })
    } else {
        console.log("[ BİLGİLENDİRME ] Telegram botu " + config.telegram_sohbet_id + " ID'li sohbete bilgilendirme yapacak!")
    }
    /**
     * Kayıt Tutma Fonksiyonu
     * `mesaj` parametresini konsol ve/veya telegram'a gönderir.
     * @param {string} mesaj
     * `mekan = 0` sadece konsol,
     * `mekan = 1` hem konsol hem telegram
     * @param {number} [mekan=0]
     */
    async function kayitTut(mesaj, mekan = config.debug) {
        try {
            if (mekan == 1 && config.telegram_sohbet_id) await tBot.telegram.sendMessage(config.telegram_sohbet_id, mesaj)
            console.log(mesaj)
        } catch {
            if (mekan == 1) console.log(mesaj + " (TELEGRAM'A GÖNDERİLEMEDİ)"); else console.log(mesaj);
        }
    }
    tBot.launch();
    /**
     * Randevu Dene Fonksiyonu
     * Randevu oluşturmaya çalışır, randevu olsun veya olmasın randevu durumunu(0 veya 1) sayfa ile birlikte randevuKontrol fonksiyonuna aktarır.
     */
    async function randevuDene() {
        let tarih = new Date();
        let tarihMesaj = `${tarih.getDate()}/${tarih.getMonth() + 1}/${tarih.getFullYear()}, ${tarih.getHours()}.${tarih.getMinutes()}`
        await kayitTut("[ ! ] Randevu alma denemesi başlıyor (" + tarihMesaj + ")", config.debug);
        await kayitTut("[ ! ] Web sayfası açılıyor!", config.debug)
        const browser = await puppeteer.launch({ headless: true });
        global.browser = browser
        const page = await browser.newPage();
        await page.exposeFunction("rk", randevuKontrol)
        await page.goto('https://webrandevu.medicine.ankara.edu.tr/faces/default.xhtml');
        /* Giriş Ekranı Bilgilerini Doldurma */
        await kayitTut("[ ! ] Giriş bilgileri dolduruluyor!", config.debug)
        await page.waitForSelector('input[name="j_idt13:acusername"]');
        await page.$eval('input[name="j_idt13:acusername"]', (el, tc) => el.value = tc, config.tc);
        await page.waitForSelector('input[name="j_idt13:acpassword"]');
        await page.$eval('input[name="j_idt13:acpassword"]', (el, sifre) => el.value = sifre, config.sifre);
        await page.click('button[name="j_idt13:j_idt32"]');
        await kayitTut("[ ! ] GİRİŞ YAP tıklandı!", config.debug)
        await page.waitForNavigation({ waitUntil: 'networkidle2' })
        await kayitTut("[ ! ] Giriş yapıldı!", config.debug)
        /* Randevu Alma Sayfasına Yönlendirme */
        await page.evaluate(function () {
            PrimeFaces.ab({ source: 'menuMessage:j_idt19', update: 'menuMessage', formId: 'menuMessage' });
        })
        await page.waitForNavigation({ waitUntil: 'networkidle2' })
        await kayitTut("[ ! ] Randevu sayfasına yönlendirildi!", config.debug)
        /* Bölüm Seçme */
        await kayitTut("[ ! ] Bölüm seçiliyor! (" + config.bolumler[config.istenilen_bolum] + ")", config.debug)
        await page.click('label#newAppointmentForm\\:organization_label');
        let bolum_ismi = await page.evaluate(async function (bolum) {
            let panel = document.querySelector("div#newAppointmentForm\\:organization_panel")
            let div = panel.querySelector(".ui-selectonemenu-items-wrapper")
            let ul = div.querySelector("ul");
            let li = ul.querySelector(`[data-label="${bolum}"]`)
            li.setAttribute("id", "BolumSecmeTiklamaReferansID_xd")
            return li.innerHTML;
        }, config.bolumler[config.istenilen_bolum])
        await page.click("#BolumSecmeTiklamaReferansID_xd")
        await kayitTut("[ ! ] Bölüm seçildi! (" + bolum_ismi + ")", config.debug)
        await page.waitForTimeout(config.islem_araligi_sn * 1000);
        /* Poliklinik Seçme */
        await kayitTut("[ ! ] Poliklinik seçiliyor!", config.debug)
        await page.click('label#newAppointmentForm\\:doctor_label');
        let poliklinik_ismi = await page.evaluate(async function () {
            let panel = document.querySelector("div#newAppointmentForm\\:doctor_panel")
            let div = panel.querySelector(".ui-selectonemenu-items-wrapper")
            let ul = div.querySelector("ul");
            let li = ul.querySelectorAll('li');
            li[1].setAttribute("id", "PoliklinikSecmeReferansID_xd")
            return li[1].innerHTML;
        })
        await page.click("#PoliklinikSecmeReferansID_xd")
        await kayitTut("[ ! ] Poliklinik seçildi! (" + poliklinik_ismi + ")", config.debug)
        await page.waitForTimeout(config.islem_araligi_sn * 1000);
        /* Randevu Var Mı Kontrolü */
        let randevuDurum = await page.$eval("#newAppointmentForm\\:alertDialog", async (el) => {
            if (el.style.visibility == "visible") {
                // RANDEVU YOK
                try {
                    return rk(0)
                } catch { }
            } else {
                // RANDEVU VAR
                try {
                    return rk(1)
                } catch { }
            }
        })
        if (randevuDurum) {
            /* Randevu Tarih Seçme */
            await page.click("label#newAppointmentForm\\:appointmentDate_label")
            await kayitTut("[ ! ] Randevu tarihleri sıralanıyor!", config.debug)
            let randevu_tarihi = await page.evaluate(async function (devam) {
                let panel = document.querySelector("div#newAppointmentForm\\:appointmentDate_panel")
                let div = panel.querySelector(".ui-selectonemenu-items-wrapper")
                let ul = div.querySelector("ul");
                let li = ul.querySelectorAll('li');
                var x = "[ ! ] Randevu tarihleri:\n"
                li.forEach((elem, index) => { if (index != 0) x = x + elem.innerHTML + "\n" })
                /* Rastgele bir tarih seç */
                let random_date = { innerHTML: "SEÇİLMEDİ" }
                if (!devam) {
                    random_date = li[Math.floor(Math.random() * li.length)];
                    random_date.setAttribute("id", "TarihSecmeReferansID_xd")
                }
                return { mesaj: x, secilen: random_date.innerHTML };
            }, config.randevu_bulununca_kapat)
            await page.click("#TarihSecmeReferansID_xd")
            await kayitTut(randevu_tarihi.mesaj + "\n" + "[ ! ] Rastgele bir şekilde seçilen randevu tarihi: " + randevu_tarihi.secilen, 1);
            await page.waitForTimeout(config.islem_araligi_sn * 1000);
            if (!config.randevu_bulununca_kapat) {
                /* Randevu Saati Seçme */
                await page.click("label#newAppointmentForm\\:appointmentTime_label")
                await kayitTut("[ ! ] Randevu saatleri sıralanıyor!", config.debug)
                let randevu_saati = await page.evaluate(async function () {
                    let panel = document.querySelector("div#newAppointmentForm\\:appointmentTime_panel")
                    let div = panel.querySelector(".ui-selectonemenu-items-wrapper")
                    let ul = div.querySelector("ul");
                    let li = ul.querySelectorAll('li');
                    li.forEach((elem, index) => { if (index != 0) x = x + elem.innerHTML + "\n" })
                    var x = "[ ! ] Randevu saatleri:\n"
                    li.forEach((elem) => x = x + elem.innerHTML + "\n")
                    /* Rastgele bir tarih seç */
                    let random_time = li[Math.floor(Math.random() * li.length)];
                    random_time.setAttribute("id", "SaatSecmeReferansID_xd");
                    return { mesaj: x, secilen: random_time.innerHTML };
                })
                await page.click("#SaatSecmeReferansID_xd")
                await kayitTut(randevu_saati.mesaj + "\n" + "[ ! ] Rastgele bir şekilde seçilen randevu saati: " + randevu_saati.secilen, 1);
                await page.waitForTimeout(config.islem_araligi_sn * 1000);
                await page.click("#newAppointmentForm\\:appointmentButton")
                await kayitTut("[ ! ] RANDEVU AL tıklandı!", config.debug);
                await page.waitForTimeout(config.islem_araligi_sn * 1000 + 1500);
                await kayitTut("[ ! ] Randevu başarıyla alındı!\n", config.debug);
                /* PDF ve ekran görüntüsünü kaydet/telegramdan at */
                try {
                    await page.screenshot({ path: "randevu.png" });
                    await tBot.telegram.sendPhoto(config.telegram_sohbet_id, {
                        source: "./randevu.png",
                    }).catch(function (error) { console.log(error); })
                } catch {
                    await kayitTut("[ ! ] Ekran görüntüsü alınamadı!", config.debug);
                }
                const dom = await page.$eval('#newAppointmentForm\\:printPanel', (element) => {
                    return element.innerHTML
                })
                await page.setContent(dom)
                try {
                    await page.pdf({ path: "randevu.pdf" })
                    fs.readFile("./randevu.pdf", async function (err, data) {
                        if (!err) {
                            await tBot.telegram.sendDocument(config.telegram_sohbet_id, {
                                source: data,
                                filename: 'Randevu.pdf'
                            }).catch(function (error) { console.log(error); })
                        } else {
                            console.log(err)
                        }
                    })
                } catch {
                    await kayitTut("[ ! ] PDF oluşturulamadı!", config.debug);
                }
                await kayitTut("[ ! ] Randevu Bilgileri:\nBölüm: "+ bolum_ismi + "\nPoliklinik: "+ poliklinik_ismi + "\nTarih: " + randevu_tarihi.secilen + "\nSaati: " + randevu_saati.secilen, 1)
                await kayitTut("[ ! ] Bot kapanıyor!", 1)
                await browser.close();
                await process.exit(0);
            }
        }
    }
    /** 
     * Randevu Kontrol Fonksiyonu
     *
     * @param {Number} durum 0 ise randevu yok, 1 ise randevu var demektir. 0 olunca bekleme moduna girer.
     * @param {puppeteer.Page} sayfa Açılmış olan sayfadır, sayfayı kapatmak için gereklidir.
     */
    async function randevuKontrol(durum) {
        if (durum == 0) {
            await kayitTut("[ ! ] ÜZGÜNÜM RANDEVU YOK, " + config.deneme_araligi_dk + " dakika sonra tekrar deneyeceğim!", 1)
            await global.browser.close();
            await setTimeout(() => { randevuDene() }, config.deneme_araligi_dk * 60 * 1000);
        } else if (durum == 1) {
            await kayitTut("[ ! ] RANDEVU BULUNDU!", 1)
            if (config.randevu_bulununca_kapat) {
                await kayitTut("[ ! ] Bot kapanıyor!", config.debug)
                await global.browser.close();
                process.exit(0);
            } else {
                return 1
            }
        } else {
            await kayitTut("[ ! ] ÜZGÜNÜM RANDEVU ALMAYA ÇALIŞIRKEN HATA MEYDANA GELDİ, " + config.deneme_araligi_dk + " dakika sonra tekrar deneyeceğim!", 1)
            await global.browser.close();
            await setTimeout(() => { randevuDene() }, config.deneme_araligi_dk * 60 * 1000);
        }
    }
    // İlk kıvılcım!
    randevuDene();
})();