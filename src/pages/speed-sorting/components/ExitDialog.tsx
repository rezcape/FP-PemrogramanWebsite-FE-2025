import { Button } from "@/components/ui/button";

interface ExitDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExitDialog({ isOpen, onCancel, onConfirm }: ExitDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-xl font-bold mb-2">Exit Game?</h3>
        <p className="text-gray-600 mb-6">Your progress will be lost.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
          >
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
