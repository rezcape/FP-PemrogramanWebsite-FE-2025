import { Route, Routes } from "react-router-dom";
import CreateProject from "./pages/CreateProject";
import CreateQuiz from "./pages/CreateQuiz";
import EditQuiz from "./pages/EditQuiz";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import MyProjectsPage from "./pages/MyProjectsPage";
import ProfilePage from "./pages/ProfilePage";
import Quiz from "./pages/Quiz";
import Register from "./pages/Register";
import Sandbox from "./pages/Sandbox";
import CreateSpeedSorting from "./pages/speed-sorting/CreateSpeedSorting";
import EditSpeedSorting from "./pages/speed-sorting/EditSpeedSorting";
import ProtectedRoute from "./routes/ProtectedRoutes";
import CreateAnagram from "./pages/Anagram/CreateAnagram";
import PlayAnagram from "./pages/Anagram/PlayAnagram";
import EditAnagram from "./pages/Anagram/EditAnagram";
import PlayUnjumble from "./pages/unjumble/PlayUnjumble";
import CreateUnjumble from "./pages/unjumble/CreateUnjumble";
import EditUnjumble from "./pages/unjumble/EditUnjumble";

import MazeChase from "./pages/maze-chase/MazeChase";
import CreateMazeChase from "./pages/maze-chase/CreateMazeChase";
import EditMazeChase from "./pages/maze-chase/EditMazeChase";

import OpenTheBoxGame from "./pages/open-the-box";
import CreateOpenTheBox from "./pages/open-the-box/createOpenTheBox";
import EditOpenTheBox from "./pages/open-the-box/editOpenTheBox";

// 📌 TAMBAHAN 1: Import Komponen Game Pair or No Pair
import PairOrNoPairGame from "./pages/pair-or-no-pair";
import CreatePairOrNoPair from "./pages/pair-or-no-pair/create";
import CreateTrueOrFalse from "./pages/true-or-false/CreateTrueOrFalse";
import EditTrueOrFalse from "./pages/true-or-false/EditTrueOrFalse";
import PlayTrueOrFalse from "./pages/true-or-false/TrueOrFalse";
import EditPairOrNoPair from "./pages/pair-or-no-pair/edit";

import CreateSlidingPuzzle from "./pages/sliding-puzzle/CreateSlidingPuzzle";
import EditSlidingPuzzle from "./pages/sliding-puzzle/EditSlidingPuzzle";
import PlaySlidingPuzzle from "./pages/sliding-puzzle/PlaySlidingPuzzle";

// Import Komponen Game Whack-a-Mole
import CreateFlipTiles from "./pages/flip-tiles/CreateFlipTiles";
import EditFlipTiles from "./pages/flip-tiles/EditFlipTiles";
import FlipTiles from "./pages/flip-tiles/FlipTiles";
import TypeTheAnswer from "./pages/TypeTheAnswer";
import CreateTypeTheAnswer from "./pages/CreateTypeTheAnswer";
import EditTypeTheAnswer from "./pages/EditTypeTheAnswer";
import WhackAMoleGame from "./pages/whack-a-mole";
import CreateWhackAMole from "./pages/whack-a-mole/create";
import EditWhackAMole from "./pages/whack-a-mole/edit";
import SpeedSorting from "./pages/speed-sorting/SpeedSorting";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/quiz/play/:id" element={<Quiz />} />
        <Route path="/unjumble/play/:id" element={<PlayUnjumble />} />
        <Route path="/open-the-box/play/:id" element={<OpenTheBoxGame />} />

        <Route path="/create-open-the-box" element={<CreateOpenTheBox />} />

        <Route path="/type-the-answer/play/:id" element={<TypeTheAnswer />} />
        <Route path="/maze-chase/play/:id" element={<MazeChase />} />
        <Route path="/flip-tiles/play/:id" element={<FlipTiles />} />
        <Route path="/speed-sorting/play/:id" element={<SpeedSorting />} />
        <Route path="/anagram/play/:id" element={<PlayAnagram />} />
        <Route
          path="/pair-or-no-pair/play/:gameId"
          element={<PairOrNoPairGame />}
        />
        <Route path="/true-or-false/play/:id" element={<PlayTrueOrFalse />} />
        <Route path="/whack-a-mole/play/:gameId" element={<WhackAMoleGame />} />
        <Route
          path="/sliding-puzzle/play/:id"
          element={<PlaySlidingPuzzle />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-projects" element={<MyProjectsPage />} />
          <Route path="/create-projects" element={<CreateProject />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/create-flip-tiles" element={<CreateFlipTiles />} />
          <Route
            path="/create-type-the-answer"
            element={<CreateTypeTheAnswer />}
          />
          <Route
            path="/create-speed-sorting"
            element={<CreateSpeedSorting />}
          />
          <Route path="/create-anagram" element={<CreateAnagram />} />
          <Route
            path="/create-pair-or-no-pair"
            element={<CreatePairOrNoPair />}
          />
          <Route path="/create-whack-a-mole" element={<CreateWhackAMole />} />
          <Route path="/whack-a-mole/edit/:id" element={<EditWhackAMole />} />
          <Route path="/create-maze-chase" element={<CreateMazeChase />} />
          <Route path="/create-anagram" element={<CreateAnagram />} />
          <Route path="/quiz/edit/:id" element={<EditQuiz />} />
          <Route path="/flip-tiles/edit/:id" element={<EditFlipTiles />} />
          <Route
            path="/type-the-answer/edit/:id"
            element={<EditTypeTheAnswer />}
          />
          <Route
            path="/pair-or-no-pair/edit/:id"
            element={<EditPairOrNoPair />}
          />
          <Route
            path="/speed-sorting/edit/:id"
            element={<EditSpeedSorting />}
          />
          <Route path="/maze-chase/edit/:id" element={<EditMazeChase />} />
          <Route path="/anagram/edit/:id" element={<EditAnagram />} />

          <Route path="/create-unjumble" element={<CreateUnjumble />} />
          <Route path="/unjumble/edit/:id" element={<EditUnjumble />} />

          <Route path="/create-true-or-false" element={<CreateTrueOrFalse />} />
          <Route path="/true-or-false/edit/:id" element={<EditTrueOrFalse />} />
          <Route
            path="/create-sliding-puzzle"
            element={<CreateSlidingPuzzle />}
          />
          <Route
            path="/sliding-puzzle/edit/:id"
            element={<EditSlidingPuzzle />}
          />
          <Route element={<ProtectedRoute />}>
            {/* ...route lain... */}
            <Route path="/open-the-box/edit/:id" element={<EditOpenTheBox />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
