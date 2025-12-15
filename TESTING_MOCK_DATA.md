# Testing Type the Answer Game dengan Mock Data

## 📌 Kenapa Pakai Mock Data?

Karena backend API belum selesai dibuat oleh rekan tim backend, kita menggunakan **mock data** untuk testing frontend tanpa perlu koneksi ke server backend.

## 🎮 Cara Test Game

### Opsi 1: Dari Home Page

1. Buka browser dan akses `http://localhost:3000`
2. Di bagian atas halaman, akan ada kotak kuning **"🧪 Testing Mode"**
3. Klik tombol **"🎮 Test Type the Answer Game"**
4. Game akan langsung dimulai dengan 5 soal matematika

### Opsi 2: Direct URL

Langsung akses URL ini di browser:

```
http://localhost:3000/type-the-answer/play/mock-game-123
```

## ✨ Fitur yang Bisa Ditest

### 1. **Gameplay**

- ✅ Timer countdown (3 menit / 180 detik)
- ✅ Progress bar menunjukkan soal ke berapa
- ✅ Input jawaban dengan Enter key support
- ✅ Validasi jawaban otomatis
- ✅ Navigasi next/previous soal

### 2. **Game Controls**

- ✅ Tombol Pause/Resume (ikon pause ⏸ di kanan atas)
- ✅ Tombol Exit (ikon X di kiri atas dengan konfirmasi)
- ✅ Time's Up otomatis submit

### 3. **Result Screen**

- ✅ Tampilan bintang (1-3 stars berdasarkan persentase)
- ✅ Score total dan max score
- ✅ Jumlah jawaban benar vs total soal
- ✅ Persentase keberhasilan
- ✅ Feedback message (Perfect/Great/Good/Keep trying)
- ✅ Tombol Back to Home

## 📝 Data Mock Game

**Judul Game:** Matematika Dasar  
**Time Limit:** 180 detik (3 menit)  
**Score Per Question:** 10 poin  
**Total Questions:** 5 soal

### Soal dan Jawaban:

1. **"Berapa hasil dari 5 + 3?"** → Jawaban: `8`
2. **"Berapa hasil dari 10 - 4?"** → Jawaban: `6`
3. **"Berapa hasil dari 7 × 2?"** → Jawaban: `14`
4. **"Berapa hasil dari 20 ÷ 5?"** → Jawaban: `4`
5. **"Berapa hasil dari 15 + 7?"** → Jawaban: `22`

> **Catatan:** Jawaban tidak case-sensitive dan whitespace akan di-trim otomatis

## 🔍 Cara Kerja Mock Data

### File Structure:

```
src/
  mocks/
    typeTheAnswerMock.ts       # Mock data dan fungsi check answers
  pages/
    TypeTheAnswer.tsx          # Game page dengan mock support
```

### Logic Flow:

1. **Load Game Data**

   ```typescript
   if (id === "mock-game-123") {
     setGame(mockTypeTheAnswerGame);
     // Skip API call ke backend
   }
   ```

2. **Submit Answers**

   ```typescript
   if (id === "mock-game-123") {
     const mockResult = mockCheckAnswers(finalAnswers);
     // Check answers di client-side
   }
   ```

3. **Skip Play Count**
   ```typescript
   if (id !== "mock-game-123") {
     await addPlayCount(id);
     // Jangan update play count untuk mock
   }
   ```

## 🚀 Testing Scenarios

### Test 1: Perfect Score

Jawab semua soal dengan benar:

- Soal 1: `8`
- Soal 2: `6`
- Soal 3: `14`
- Soal 4: `4`
- Soal 5: `22`

**Expected Result:**

- ⭐⭐⭐ 3 Stars
- Score: 50/50 (100%)
- Feedback: "Perfect! Amazing work!"

### Test 2: Good Score

Jawab 3-4 soal benar, sisanya salah

**Expected Result:**

- ⭐⭐ 2 Stars atau ⭐ 1 Star
- Score: 30-40/50 (60-80%)
- Feedback: "Great job!" atau "Good effort!"

### Test 3: Time's Up

Biarkan timer habis sebelum selesai

**Expected Result:**

- Auto submit ketika timer = 0
- Score sesuai jawaban yang sudah diisi

### Test 4: Pause & Resume

1. Klik tombol Pause (⏸) di tengah game
2. Timer berhenti
3. Klik Resume untuk lanjut

**Expected Result:**

- Timer freeze saat pause
- Game state tersimpan

### Test 5: Exit Game

1. Klik tombol Exit (X) di tengah game
2. Konfirmasi "Are you sure?"
3. Klik OK

**Expected Result:**

- Redirect ke Home Page
- Progress hilang (tidak tersimpan)

## 🔧 Troubleshooting

### Problem: Game tidak muncul

**Solution:**

- Pastikan dev server frontend running: `npm run dev`
- Check browser console (F12) untuk error
- Pastikan file `src/mocks/typeTheAnswerMock.ts` ada

### Problem: Timer tidak jalan

**Solution:**

- Pastikan sudah klik tombol "Start Game"
- Check apakah state `gameStarted` true
- Pastikan tidak dalam state pause

### Problem: Jawaban tidak diterima

**Solution:**

- Tekan Enter setelah ketik jawaban
- Atau klik tombol "Next Question"
- Check apakah input field disabled

## 📚 Next Steps

### Setelah Backend Ready:

1. **Remove Mock Testing Box** dari HomePage.tsx
2. **Test dengan Real API** menggunakan game ID asli
3. **Verify API Endpoints:**
   - `GET /api/game/game-type/type-the-answer/:id/play/public`
   - `POST /api/game/game-type/type-the-answer/:id/check`
   - `POST /api/game/play-count`

### API Contract untuk Backend Developer:

**GET /api/game/game-type/type-the-answer/:id/play/public**

```json
{
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "thumbnail_image": "string | null",
    "is_published": true,
    "questions": [
      {
        "question_text": "string",
        "correct_answer": "string",
        "question_index": 0
      }
    ],
    "time_limit_seconds": 180,
    "score_per_question": 10
  }
}
```

**POST /api/game/game-type/type-the-answer/:id/check**

Request Body:

```json
{
  "answers": [
    {
      "question_index": 0,
      "user_answer": "string"
    }
  ]
}
```

Response:

```json
{
  "data": {
    "correct_answers": 5,
    "total_questions": 5,
    "max_score": 50,
    "score": 50,
    "percentage": 100
  }
}
```

**POST /api/game/play-count**

Request Body:

```json
{
  "game_id": "string"
}
```

## ✅ Checklist Testing

- [ ] Game loads successfully
- [ ] Timer starts countdown
- [ ] Can answer all questions
- [ ] Input validation works
- [ ] Pause/Resume functionality
- [ ] Exit with confirmation
- [ ] Time's up auto-submit
- [ ] Result screen displays correctly
- [ ] Stars animation
- [ ] Back to home button works
- [ ] Responsive design on mobile

---

**Good luck testing! 🎉**

Jika ada error atau pertanyaan, cek browser console (F12) untuk error messages.
