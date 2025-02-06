import React, { useEffect, useRef } from 'react';
import { Drawing } from '../drawing_with_ft/drawing';
import { DefaultDataProvider } from '../drawing_with_ft/dataProvider';
import * as paper from 'paper';
import '../styles/Home.css';

const Home: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Install paper.js and setup the canvas
            paper.install(window);
            paper.setup(canvas);
            const drawing = new Drawing(new DefaultDataProvider());
            drawing.initialize().then(() => {
                paper.view.onFrame = (event: { delta: number; }) => {
                    drawing.animateItems(event.delta);
                }
                paper.view.onResize = () => {
                    drawing.setBackground();
                };
                drawing.restart();
            });
        }
    }, []);

    return (
        <>
            <header>
                <nav>
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#portfolio">Portfolio</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </nav>
            </header>

            <main>
                <canvas id="myCanvas" ref={canvasRef}></canvas>
            </main>

            <footer>
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
