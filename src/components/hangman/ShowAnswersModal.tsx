import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ShowAnswersModalProps {
  isOpen: boolean;
  completedQuestions: Array<{
    question: string;
    answer: string;
    playerAnswer: string;
    isCorrect: boolean;
  }>;
  onClose: () => void;
}

export const ShowAnswersModal: React.FC<ShowAnswersModalProps> = ({
  isOpen,
  completedQuestions,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50 rounded-2xl">
      <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90%] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Review Answers</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            {completedQuestions.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 border-l-4 ${
                  item.isCorrect
                    ? "bg-green-900 bg-opacity-30 border-green-500"
                    : "bg-red-900 bg-opacity-30 border-red-500"
                }`}
              >
                <div className="text-slate-300 text-sm mb-2">
                  Question {index + 1}
                </div>
                <div className="text-white font-semibold mb-3">
                  {item.question}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Correct Answer: </span>
                    <span
                      className={`font-mono font-bold ${
                        item.isCorrect ? "text-green-400" : "text-slate-500"
                      }`}
                    >
                      {item.isCorrect ? item.answer : "●●●●●●●●"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Your Answer: </span>
                    <span
                      className={`font-mono font-bold ${
                        item.isCorrect ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {item.playerAnswer || "Not completed"}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs">
                  {item.isCorrect ? (
                    <span className="text-green-400">✓ Correct</span>
                  ) : (
                    <span className="text-red-400">✗ Incorrect</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 p-4">
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShowAnswersModal;
