import { Route, Routes } from "react-router-dom";
import CreateProject from "./pages/CreateProject";
import CreateQuiz from "./pages/CreateQuiz";
import EditQuiz from "./pages/EditQuiz";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import MyProjectsPage from "./pages/MyProjectsPage";
import CreateQuiz from "./pages/CreateQuiz";
import CreateImageQuiz from "./pages/image-quiz/CreateImageQuiz";
import EditImageQuiz from "./pages/image-quiz/EditImageQuiz";
import PlayImageQuiz from "./pages/image-quiz/PlayImageQuiz";
import CreateProject from "./pages/CreateProject";
import EditQuiz from "./pages/EditQuiz";
import ProfilePage from "./pages/ProfilePage";
import Quiz from "./pages/Quiz";
import Register from "./pages/Register";
import Sandbox from "./pages/Sandbox";
import ProtectedRoute from "./routes/ProtectedRoutes";

import AirplaneGeneralGame from "./pages/airplane";
import CreateAirplane from "./pages/CreateAirplane";
import EditAirplane from "./pages/EditAirplane";

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

import PairOrNoPairGame from "./pages/pair-or-no-pair";
import CreatePairOrNoPair from "./pages/pair-or-no-pair/create";
import EditPairOrNoPair from "./pages/pair-or-no-pair/edit";

import HangmanGame from "./pages/hangman";
import CreateHangmanTemplate from "./pages/hangman/create";

import CreateTrueOrFalse from "./pages/true-or-false/CreateTrueOrFalse";
import EditTrueOrFalse from "./pages/true-or-false/EditTrueOrFalse";
import PlayTrueOrFalse from "./pages/true-or-false/TrueOrFalse";

import CreateSlidingPuzzle from "./pages/sliding-puzzle/CreateSlidingPuzzle";
import EditSlidingPuzzle from "./pages/sliding-puzzle/EditSlidingPuzzle";
import PlaySlidingPuzzle from "./pages/sliding-puzzle/PlaySlidingPuzzle";

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
import CreateSpeedSorting from "./pages/speed-sorting/CreateSpeedSorting";
import EditSpeedSorting from "./pages/speed-sorting/EditSpeedSorting";

import CreateCrossword from "./pages/crosswords/create";
import PlayCrossword from "./pages/crosswords/index";
import EditCrossword from "./pages/crosswords/edit";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sandbox" element={<Sandbox />} />

        <Route path="/quiz/play/:id" element={<Quiz />} />
        <Route path="/image-quiz/play/:id" element={<PlayImageQuiz />} />
        <Route path="/unjumble/play/:id" element={<PlayUnjumble />} />
        <Route path="/open-the-box/play/:id" element={<OpenTheBoxGame />} />
        <Route path="/type-the-answer/play/:id" element={<TypeTheAnswer />} />
        <Route path="/maze-chase/play/:id" element={<MazeChase />} />
        <Route path="/flip-tiles/play/:id" element={<FlipTiles />} />
        <Route path="/speed-sorting/play/:id" element={<SpeedSorting />} />
        <Route path="/anagram/play/:id" element={<PlayAnagram />} />
        <Route path="/hangman/play/:id" element={<HangmanGame />} />
        <Route
          path="/pair-or-no-pair/play/:gameId"
          element={<PairOrNoPairGame />}
        />
        <Route path="/crossword/play/:id" element={<PlayCrossword />} />
        <Route path="/true-or-false/play/:id" element={<PlayTrueOrFalse />} />
        <Route path="/whack-a-mole/play/:gameId" element={<WhackAMoleGame />} />
        <Route
          path="/sliding-puzzle/play/:id"
          element={<PlaySlidingPuzzle />}
        />
        <Route path="/airplane/play/:id" element={<AirplaneGeneralGame />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-projects" element={<MyProjectsPage />} />
          <Route path="/create-projects" element={<CreateProject />} />

          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/create-image-quiz" element={<CreateImageQuiz />} />
          <Route path="/quiz/edit/:id" element={<EditQuiz />} />
          <Route path="/image-quiz/edit/:id" element={<EditImageQuiz />} />
          <Route path="/quiz/edit/:id" element={<EditQuiz />} />

          <Route path="/create-airplane" element={<CreateAirplane />} />
          <Route path="/airplane/edit/:id" element={<EditAirplane />} />

          <Route path="/create-open-the-box" element={<CreateOpenTheBox />} />
          <Route path="/open-the-box/edit/:id" element={<EditOpenTheBox />} />

          <Route path="/create-flip-tiles" element={<CreateFlipTiles />} />
          <Route path="/flip-tiles/edit/:id" element={<EditFlipTiles />} />

          <Route
            path="/create-type-the-answer"
            element={<CreateTypeTheAnswer />}
          />
          <Route
            path="/type-the-answer/edit/:id"
            element={<EditTypeTheAnswer />}
          />

          <Route
            path="/create-speed-sorting"
            element={<CreateSpeedSorting />}
          />
          <Route
            path="/speed-sorting/edit/:id"
            element={<EditSpeedSorting />}
          />
          <Route path="/create-crossword" element={<CreateCrossword />} />
          <Route path="/crossword/edit/:id" element={<EditCrossword />} />

          <Route path="/create-hangman" element={<CreateHangmanTemplate />} />
          <Route path="/hangman/edit/:id" element={<CreateHangmanTemplate />} />

          <Route path="/create-whack-a-mole" element={<CreateWhackAMole />} />
          <Route path="/whack-a-mole/edit/:id" element={<EditWhackAMole />} />

          <Route path="/create-maze-chase" element={<CreateMazeChase />} />
          <Route path="/maze-chase/edit/:id" element={<EditMazeChase />} />

          <Route path="/create-anagram" element={<CreateAnagram />} />
          <Route path="/anagram/edit/:id" element={<EditAnagram />} />

          <Route path="/create-unjumble" element={<CreateUnjumble />} />
          <Route path="/unjumble/edit/:id" element={<EditUnjumble />} />

          <Route
            path="/create-pair-or-no-pair"
            element={<CreatePairOrNoPair />}
          />
          <Route
            path="/pair-or-no-pair/edit/:id"
            element={<EditPairOrNoPair />}
          />

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
        </Route>
      </Routes>
    </>
  );
}

export default App;
