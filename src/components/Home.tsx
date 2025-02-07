import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawing } from '../drawing_with_ft/drawing';
import { DefaultDataProvider } from '../drawing_with_ft/dataProvider';
import * as paper from 'paper';
import '../styles/Home.css';

const Home: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            paper.setup(canvas);
            const drawing = new Drawing(new DefaultDataProvider());
            drawing.initialize().then(() => {
                paper.view.onFrame = (event: { delta: number; }) => {
                    drawing.animateItems(event.delta);
                }
                paper.view.onResize = () => {
                    drawing.setBackground();
                    drawing.restart();
                };
                drawing.restart();
            });
        }
    }, []);

    return (
        <>
            <header className="home-header">
                <nav className="home-nav">
                    <ul>
                        <li><a href="#home" onClick={() => navigate('/')}>Home</a></li>
                        <li><a href="#portfolio" onClick={() => navigate('/games')}>Portfolio</a></li>
                        <li><a href="#about" onClick={() => navigate('/about')}>About</a></li>
                        <li><a href="#contact" onClick={() => navigate('/contact')}>Contact</a></li>
                    </ul>
                </nav>
            </header>

            <main className="home-main">
                <div className="home-canvas-wrapper">
                    <canvas id="myCanvas" ref={canvasRef} className="home-canvas"></canvas>
                </div>
            </main>

            <footer className="home-footer">
                <div className="social-media">
                    <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a href="https://github.com/yourprofile" target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
                <p>&copy; 2025 Your Name. All rights reserved.</p>
            </footer>
        </>
    );
};

export default Home;
