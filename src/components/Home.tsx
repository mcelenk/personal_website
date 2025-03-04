import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawing } from '../drawing_with_ft/drawing';
import { DefaultDataProvider } from '../drawing_with_ft/dataProvider';
import * as paper from 'paper';
import '../styles/Home.css';
import { UserEvents } from '../gameplay/userEvents';
import { Position } from '../gameplay/positioning';
import { Transform } from '../gameplay/transform';

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
                new UserEvents(canvas, {
                    handleSingleClick(_: Position): boolean { return false; },
                    updateMenuItemDisplay(): void { }
                }, (transform: Transform) => {
                    drawing.scrollWithTransform(transform);
                });
            });
        }
    }, []);

    return (
        <main className="home-main">
            <div className="home-canvas-wrapper">
                <canvas id="myCanvas" ref={canvasRef} className="home-canvas"></canvas>
            </div>
        </main>
    );
};

export default Home;
