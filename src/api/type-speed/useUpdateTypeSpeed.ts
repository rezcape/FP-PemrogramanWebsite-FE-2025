interface UpdateTypeSpeedPayload {
  name?: string;
  description?: string;
  thumbnail_image?: File;
  is_publish?: boolean;
  time_limit?: number;
  texts?: Array<{
    content: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
}

import api from "@/api/axios";

export const useUpdateTypeSpeed = async (
  id: string,
  data: UpdateTypeSpeedPayload,
) => {
  const formData = new FormData();
  if (data.name) formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.thumbnail_image)
    formData.append("thumbnail_image", data.thumbnail_image);
  if (data.is_publish !== undefined)
    formData.append("is_publish", String(data.is_publish));
  if (data.time_limit) formData.append("time_limit", String(data.time_limit));
  if (data.texts) formData.append("texts", JSON.stringify(data.texts));

  const response = await api.patch(
    `/api/game/game-type/type-speed/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};
