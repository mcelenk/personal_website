import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import GameList from './GameList';
import GameScreen from './GameScreen';
import GameCreate from './GameCreate';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/games"
                        element={<ProtectedRoute element={<GameList />} />}
                    />
                    <Route
                        path="/game/:id"
                        element={<ProtectedRoute element={<GameScreen />} />}
                    />
                    <Route
                        path="/create"
                        element={<ProtectedRoute element={<GameCreate />} />}
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
