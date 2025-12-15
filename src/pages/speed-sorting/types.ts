export interface WordItem {
  text: string;
  categoryIndex: number;
  image?: File | null;
  type: "text" | "image";
  existingImageUrl?: string;
}
