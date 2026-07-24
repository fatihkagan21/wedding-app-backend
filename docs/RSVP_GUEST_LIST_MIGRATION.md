# RSVP kayıtlarını davetli planına aktarma

Bu işlem, canlı veritabanındaki mevcut RSVP yanıtlarını `GuestListEntry` kayıtlarına dönüştürür.
Her oluşturulan kayıt kaynak RSVP'nin `rsvpId` değeriyle bağlanır. Aktarım tekrar çalıştırıldığında
aynı RSVP için ikinci bir davetli kaydı oluşturulmaz.

## Aktarım Kuralları

- Katılıyor yanıtı: `Geliyor`
- Katılmıyor yanıtı: `Gelmiyor`
- Davetiye durumu: `Gönderildi`
- Taraf: `Ortak`
- Planlanan kişi sayısı: Katılan RSVP'deki kişi sayısı; katılmayan yanıtta `1`
- RSVP notu ve katılımcı isimleri: Davetli kaydının not alanı

## Render Free Workaround

Render free web servisinde shell kullanılamıyorsa aktarımı admin panelinden yapabilirsiniz.

1. Yeni sürümü deploy edin ve deploy loglarında Prisma migration'larının başarıyla uygulandığını doğrulayın.
2. `/admin` sayfasını açın.
3. İlgili etkinliği seçin.
4. **Davetli Planı** sekmesinde **RSVP aktar** butonuna basın.
5. Sonuç mesajında kaç RSVP kaydının davetli planına eklendiğini kontrol edin.

Butona tekrar basmak güvenlidir. Daha önce `rsvpId` ile bağlanmış RSVP kayıtları atlanır.
Bu işlem mevcut RSVP yanıtlarını silmez veya değiştirmez; yalnızca davetli planında eksik olan kayıtları oluşturur.

## Shell Olan Ortamda Kullanım

Önce yalnızca sonucu görmek için:

```bash
npm run migrate:rsvps-to-guest-list -- --dry-run
```

Çıktıdaki `Aktarılmayı bekleyen` sayısını kontrol ettikten sonra gerçek aktarımı çalıştırın:

```bash
npm run migrate:rsvps-to-guest-list
```

Yalnızca belirli bir etkinliği aktarmak için:

```bash
npm run migrate:rsvps-to-guest-list -- --dry-run --event-id=ETKINLIK_UUID
npm run migrate:rsvps-to-guest-list -- --event-id=ETKINLIK_UUID
```

Komut, `DATABASE_URL` environment değişkenindeki veritabanını kullanır.
