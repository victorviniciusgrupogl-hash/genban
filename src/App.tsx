import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ExpertThemeProvider } from './contexts/ExpertThemeContext';
import { ExpertLayout } from './components/layout/ExpertLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudentCalendar from './pages/student/Calendar';
import StudentSettings from './pages/student/Settings';
import StudentCampaigns from './pages/student/Campaigns';
import Finance from './pages/shared/Finance';
import ExpertDashboard from './pages/expert/Dashboard';
import ExpertStudents from './pages/expert/Students';
import ExpertSettings from './pages/expert/Settings';
import ExpertCampaigns from './pages/expert/Campaigns';
import ExpertOperations from './pages/expert/Operations';
import ExpertCalendar from './pages/expert/Calendar';
import ExpertFinance from './pages/expert/Finance';
import AdminDashboard from './pages/admin/Dashboard';
import AdminExperts from './pages/admin/Experts';
import AdminStudents from './pages/admin/Students';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
    <ExpertThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="calendar" element={<StudentCalendar />} />
            <Route path="campaigns" element={<StudentCampaigns />} />
            <Route path="finance" element={<Finance />} />
            <Route path="settings" element={<StudentSettings />} />
          </Route>

          {/* Expert Routes */}
          <Route path="/expert" element={<ExpertLayout />}>
            <Route index element={<ExpertDashboard />} />
            <Route path="students" element={<ExpertStudents />} />
            <Route path="operations" element={<ExpertOperations />} />
            <Route path="calendar" element={<ExpertCalendar />} />
            <Route path="campaigns" element={<ExpertCampaigns />} />
            <Route path="finance" element={<ExpertFinance />} />
            <Route path="settings" element={<ExpertSettings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="experts" element={<AdminExperts />} />
            <Route path="students" element={<AdminStudents />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ExpertThemeProvider>
    </AuthProvider>
  );
}
