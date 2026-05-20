# Chess Logger (Satranç Maç Günlüğü)

Bu proje, Sistem Analizi ve Tasarımı dersi gereksinimlerine uygun olarak geliştirilmiş tam teşekküllü (CRUD) bir web uygulamasıdır. Kullanıcılar satranç maçlarını, açılış türlerini ve sonuçlarını kayıt altına alabilirler.

## Mimari ve Teknolojiler
- **Frontend:** Sadece HTML, CSS (Vanilla) ve Vanilla JavaScript kullanılmıştır. Herhangi bir framework (React, Vue vb.) içermez. Sayfa yüklenmeden dinamik olarak `fetch` API ile çalışır (SPA - Tek Sayfa Uygulaması).
- **Backend:** Node.js ve Express. İş mantığı route dosyalarından bağımsız, ayrı controller dosyalarında izole edilmiştir.
- **Veritabanı:** SQLite. `database.js` dosyası ile entegre edilmiştir.
- **API Dokümantasyonu:** Swagger UI entegrasyonu vardır.

## Kurulum ve Çalıştırma

1. Terminali veya Komut İstemini (Command Prompt / PowerShell) açın.
2. Proje klasörünün (`chess-logger`) içerisinde olduğunuzdan emin olun.
3. Uygulamayı başlatmak için şu komutu çalıştırın:
   ```bash
   node server.js
   ```

## Kullanım
- **Ana Uygulama:** Tarayıcınızda `http://localhost:3000` adresine gidin. Premium cam efektli (glassmorphism) harika bir arayüz ile karşılaşacaksınız.
- **API Dokümantasyonu (Swagger):** `http://localhost:3000/api-docs` adresine giderek tüm REST API endpoint'lerini görüntüleyebilir ve test edebilirsiniz.
