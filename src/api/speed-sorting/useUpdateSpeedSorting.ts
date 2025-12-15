import axiosInstance from "@/api/axios";

interface UpdateSpeedSortingPayload {
  name: string;
  description: string;
  thumbnail_image?: File;
  is_published?: boolean;
  categories: { name: string }[];
  items: {
    type: "text" | "image";
    value: string;
    category_index: number;
  }[];
}

export const useUpdateSpeedSorting = async (
  id: string,
  payload: UpdateSpeedSortingPayload,
) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);

  if (payload.thumbnail_image) {
    formData.append("thumbnail_image", payload.thumbnail_image);
  }

  if (payload.is_published !== undefined) {
    formData.append("is_published", payload.is_published ? "true" : "false");
  }

  formData.append("categories", JSON.stringify(payload.categories));
  formData.append("items", JSON.stringify(payload.items));

  const response = await axiosInstance.patch(
    `/api/game/game-type/speed-sorting/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};
