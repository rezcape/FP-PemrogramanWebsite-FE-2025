import { useState, useEffect } from "react";
import api from "@/api/axios";
import toast from "react-hot-toast";

interface SpeedSortingDetailResponse {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  categories: { id: string; name: string }[];
  items: {
    id: string;
    value: string;
    category_index: number;
    category_id: string;
    type: "text" | "image";
  }[];
}

export const useGetPlaySpeedSorting = (id: string) => {
  const [data, setData] = useState<SpeedSortingDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get(
          `/api/game/game-type/speed-sorting/${id}/play`,
        );
        setData(res.data.data as SpeedSortingDetailResponse);
      } catch (error) {
        console.log(error);
        setError("Gagal memuat detail Speed Sorting, coba lagi.");
        toast.error("Gagal memuat detail Speed Sorting, coba lagi.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  return { data, isLoading, error };
};
