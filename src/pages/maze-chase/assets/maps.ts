import AbandonedFactory from "./AbandonedFactory.jpg";
import MagicalForest from "./MagicalForest.jpg";

export interface MapOption {
  id: string;
  name: string;
  image: string;
}

export const AVAILABLE_MAPS: MapOption[] = [
  {
    id: "map_001",
    name: "Abandoned Factory",
    image: AbandonedFactory,
  },
  {
    id: "map_002",
    name: "Magical Forest",
    image: MagicalForest,
  },
  {
    id: "map_003",
    name: "Underground Cavern",
    image:
      "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop",
  },
];
