import api from "@/api/axios";
import toast from "react-hot-toast";

interface SpeedSortingCategory {
  name: string;
}

interface SpeedSortingItem {
  value: string;
  category_index: number;
  type: "text" | "image";
}

interface SpeedSortingPayload {
  name: string;
  description?: string;
  is_published?: boolean;
  thumbnail_image: File;
  categories: SpeedSortingCategory[];
  items: SpeedSortingItem[];
}

export const useCreateSpeedSorting = async (payload: SpeedSortingPayload) => {
  try {
    const formData = new FormData();

    formData.append("name", payload.name);
    formData.append("thumbnail_image", payload.thumbnail_image);
    if (payload.description)
      formData.append("description", payload.description);

    formData.append("categories", JSON.stringify(payload.categories));
    formData.append("items", JSON.stringify(payload.items));
    formData.append("is_published", payload.is_published ? "true" : "false");

    const res = await api.post("/api/game/game-type/speed-sorting", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    console.log(error);
    toast.error("Gagal membuat game Speed Sorting, coba lagi.");
    throw error;
  }
};
