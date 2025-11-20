import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './routes/DashboardLayout.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import HabitTrackerPage from './pages/features/HabitTrackerPage.jsx';
import NotesPage from './pages/features/NotesPage.jsx';
import TodoPage from './pages/features/TodoPage.jsx';
import PomodoroPage from './pages/features/PomodoroPage.jsx';
import ReadingListPage from './pages/features/ReadingListPage.jsx';
import WatchlistPage from './pages/features/WatchlistPage.jsx';
import JournalingPage from './pages/features/JournalingPage.jsx';
import SourceDumpPage from './pages/features/SourceDumpPage.jsx';
import AiHelperPage from './pages/features/AiHelperPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import UpgradePage from './pages/UpgradePage.jsx';
import UpgradeStatusPage from './pages/UpgradeStatusPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<WelcomePage />} />
            <Route path="habits" element={<HabitTrackerPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="tasks" element={<TodoPage />} />
            <Route path="pomodoro" element={<PomodoroPage />} />
            <Route path="reading" element={<ReadingListPage />} />
            <Route path="watch" element={<WatchlistPage />} />
            <Route path="journaling" element={<JournalingPage />} />
            <Route path="source-dump" element={<SourceDumpPage />} />
            <Route path="ai-helper" element={<AiHelperPage />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="upgrade/success" element={<UpgradeStatusPage status="success" />} />
            <Route path="upgrade/donation" element={<UpgradeStatusPage status="donation" />} />
            <Route path="upgrade/cancel" element={<UpgradeStatusPage status="cancel" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
