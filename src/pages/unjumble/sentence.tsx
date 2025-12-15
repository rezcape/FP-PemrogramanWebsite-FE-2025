import UnjumbleWord from "./unjumbleWord";

// --- Tipe Data ---
interface SentenceAreaProps {
  words: { id: number; text: string }[];

  onWordClick: (id: number) => void;
}

export default function SentenceArea({
  words,
  onWordClick,
}: SentenceAreaProps) {
  return (
    <div
      className="border-2 border-dashed border-indigo-400 rounded-lg p-4 min-h-[120px] 
                       flex flex-wrap items-center gap-2 bg-indigo-50/50 transition-all duration-300"
      role="region" // Peran untuk aksesibilitas
      aria-label="Area untuk menyusun kalimat"
    >
      {words.length === 0 ? (
        // Tampilan jika area masih kosong
        <p className="text-gray-500 text-lg italic select-none">
          &nbsp;Klik kata di area 'Pilih Kata-kata' untuk memulai kalimat
          Anda...
        </p>
      ) : (
        // Tampilkan kata-kata yang sudah tersusun
        words.map((word) => (
          <UnjumbleWord
            key={word.id}
            word={word.text}
            onClick={() => onWordClick(word.id)}
            isActive={true}
          />
        ))
      )}
    </div>
  );
}
