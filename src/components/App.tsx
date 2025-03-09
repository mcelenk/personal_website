import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import GameList from './GameList';
import GameScreen from './GameScreen';
import GameCreate from './GameCreate';
import Home from './Home';
import About from './About';
import Layout from './Layout';
import Contact from './Contact';
import Portfolio from './Portfolio';
import DrawingWithFT from './DrawingWithFT';
import CV from './Cv';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/cv" element={<CV />} />
                        <Route path="/portfolio" element={<Portfolio />} />"
                        <Route path="/drawing" element={<DrawingWithFT />} />
                        <Route path="/games" element={<ProtectedRoute element={<GameList />} />} />
                        <Route path="/game/:id" element={<ProtectedRoute element={<GameScreen />} />} />
                        <Route path="/create" element={<ProtectedRoute element={<GameCreate />} />} />
                    </Routes>
                </Layout>
            </Router>
        </AuthProvider>
    );
};

export default App;
