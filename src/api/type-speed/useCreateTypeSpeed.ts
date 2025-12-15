import api from "@/api/axios";

interface CreateTypeSpeedPayload {
  name: string;
  description?: string;
  thumbnail_image: File;
  is_publish_immediately: boolean;
  time_limit: number;
  texts: Array<{
    content: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
}

export const useCreateTypeSpeed = async (data: CreateTypeSpeedPayload) => {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  formData.append("thumbnail_image", data.thumbnail_image);
  formData.append(
    "is_publish_immediately",
    String(data.is_publish_immediately),
  );
  formData.append("time_limit", String(data.time_limit));
  formData.append("texts", JSON.stringify(data.texts));

  const response = await api.post("/api/game/game-type/type-speed", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
