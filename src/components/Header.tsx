import React from 'react';
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
    const navigate = useNavigate();
    return (
        <header className="header-container">
            <nav className="navigation-container">
                <ul>
                    <li><a href="#home" onClick={() => navigate('/')}>Home</a></li>
                    <li><a href="#portfolio" onClick={() => navigate('/portfolio')}>Portfolio</a></li>
                    <li><a href="#about" onClick={() => navigate('/about')}>About</a></li>
                    <li><a href="#contact" onClick={() => navigate('/contact')}>Contact</a></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;