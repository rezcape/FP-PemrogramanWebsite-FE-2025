import { useState, useEffect } from "react";
import api from "@/api/axios";
import toast from "react-hot-toast";

interface TypeSpeedDetail {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  is_published: boolean;
  game_json: {
    time_limit: number;
    texts: Array<{
      id: string;
      content: string;
      difficulty: "easy" | "medium" | "hard";
    }>;
  };
}

export const useGetDetailTypeSpeed = (id: string) => {
  const [data, setData] = useState<TypeSpeedDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/api/game/game-type/type-speed/${id}`);
        setData(response.data.data);
      } catch {
        setError("Failed to load Type Speed game");
        toast.error("Failed to load Type Speed game");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  return { data, isLoading, error };
};
