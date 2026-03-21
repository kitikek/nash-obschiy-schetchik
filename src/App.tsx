import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import GroupsList from './pages/Groups/GroupsList';
import GroupDetail from './pages/GroupDetail/GroupDetail';
import Profile from './pages/Profile/Profile';
import Expenses from './pages/Expenses/Expenses';
import ExpenseDetail from './pages/ExpenseDetail/ExpenseDetail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Balances from './pages/Balances/Balances';
import Terms from './pages/Auth/Terms';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/groups" element={isAuthenticated ? <GroupsList /> : <Navigate to="/login" />} />
        <Route path="/groups/:id" element={isAuthenticated ? <GroupDetail /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/expenses" element={isAuthenticated ? <Expenses /> : <Navigate to="/login" />} />
        <Route path="/expenses/:id" element={isAuthenticated ? <ExpenseDetail /> : <Navigate to="/login" />} />
        <Route path="/balances" element={isAuthenticated ? <Balances /> : <Navigate to="/login" />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;