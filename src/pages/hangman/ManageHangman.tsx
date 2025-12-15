import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, EyeOff, Eye } from "lucide-react";
import api from "@/api/axios";
import toast from "react-hot-toast";
import { togglePublishHangman } from "@/api/hangman";

interface HangmanGame {
  id: string;
  title: string;
  published: boolean;
  createdAt: string;
}

export default function ManageHangman() {
  const [games, setGames] = useState<HangmanGame[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/game/game-type/hangman/my/games")
      .then((res) => {
        setGames(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Failed to fetch games");
        setLoading(false);
      });
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/hangman/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this game?")) return;
    try {
      await api.delete(`/api/game/game-type/hangman/${id}`);
      setGames(games.filter((g) => g.id !== id));
      toast.success("Game deleted successfully!");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Failed to delete game");
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      console.log("Toggling publish:", { id, currentStatus, newStatus });
      await togglePublishHangman(id, newStatus);
      setGames(
        games.map((g) => (g.id === id ? { ...g, published: newStatus } : g)),
      );
      toast.success(
        `Game ${newStatus ? "published" : "unpublished"} successfully!`,
      );
    } catch (err: unknown) {
      console.error("Toggle publish error:", err);
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Failed to update publish status");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Hangman Games</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id} className="border-t">
                <td className="p-3 font-semibold">{game.title}</td>
                <td className="p-3">
                  {game.published ? "Published" : "Draft"}
                </td>
                <td className="p-3">
                  {new Date(game.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(game.id)}
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(game.id)}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                  <Button
                    size="sm"
                    variant={game.published ? "outline" : "default"}
                    onClick={() => handleTogglePublish(game.id, game.published)}
                  >
                    {game.published ? (
                      <>
                        <EyeOff className="w-4 h-4" /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> Publish
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
