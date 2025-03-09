import React, { useEffect, useRef } from 'react';
import { Drawing } from '../drawing_with_ft/drawing';
import { DefaultDataProvider } from '../drawing_with_ft/dataProvider';

import { UserEvents } from '../gameplay/userEvents';
import { Position } from '../gameplay/positioning';
import { Transform } from '../gameplay/transform';

import * as paper from 'paper';
import '../styles/Home.css';

const Home: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
