import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EyeIcon, SaveIcon, X } from "lucide-react";

interface ActionButtonsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (isPublished: boolean) => void;
  submitLabel?: string;
}

export function ActionButtons({
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel = "Create Game",
}: ActionButtonsProps) {
  return (
    <div className="flex gap-4 justify-end w-full">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={isSubmitting}>
            <X /> Cancel
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel? All unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        size="sm"
        variant="outline"
        disabled={isSubmitting}
        onClick={() => onSubmit(false)}
      >
        <SaveIcon /> Save Draft
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="bg-black text-white"
        onClick={() => onSubmit(true)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>{submitLabel === "Update Game" ? "Updating..." : "Creating..."}</>
        ) : (
          <>
            <EyeIcon /> {submitLabel === "Update Game" ? "Update" : "Publish"}
          </>
        )}
      </Button>
    </div>
  );
}
