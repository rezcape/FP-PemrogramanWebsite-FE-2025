import api from "@/api/axios";

interface CheckAnswerPayload {
  text_id: string;
  user_input: string;
  time_taken: number;
}

export const useCheckAnswer = async (
  gameId: string,
  data: CheckAnswerPayload,
) => {
  const response = await api.post(
    `/api/game/game-type/type-speed/${gameId}/check`,
    data,
  );
  return response.data.data;
};
