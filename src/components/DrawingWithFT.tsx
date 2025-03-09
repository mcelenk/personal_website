import React, { useState, useRef, useEffect } from 'react';
import { Drawing } from '../drawing_with_ft/drawing';
import { UserFileDataProvider } from '../drawing_with_ft/dataProvider';
import { UserEvents } from '../gameplay/userEvents';
import { Position } from '../gameplay/positioning';
import { Transform } from '../gameplay/transform';
import * as paper from 'paper';
import '../styles/Common.css';
import '../styles/DrawingWithFT.css';

const DrawingWithFT: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [numCircles, setNumCircles] = useState<number>(10);
    const [paceFactor, setPaceFactor] = useState<number>(2);
    const [drawing, setDrawing] = useState<Drawing | null>(null);

    const NUM_CIRCLES_MAX = 250;

    useEffect(() => {
        if (file && canvasRef.current) {
            const canvas = canvasRef.current;
            paper.setup(canvas);

            const fileDataProvider = new UserFileDataProvider(file);
            const instance = new Drawing(fileDataProvider);
            setDrawing(instance);

            instance.initialize().then(() => {
                setNumCircles(Math.min(NUM_CIRCLES_MAX, instance.getNumCircles() ?? 2));
                setPaceFactor(instance.getPace() ?? 1);
                paper.view.onFrame = (event: { delta: number; }) => {
                    instance.animateItems(event.delta);
                };

                paper.view.onResize = () => {
                    instance.setBackground();
                    instance.restart();
                };

                instance.restart();
            });

            new UserEvents(canvas, {
                handleSingleClick(_: Position): boolean {
                    return false;
                },
                updateMenuItemDisplay(): void { }
            }, (transform: Transform) => {
                instance.scrollWithTransform(transform);
            });
        }
    }, [file]);

    useEffect(() => {
        drawing?.setPace(paceFactor);
    }, [paceFactor]);

    useEffect(() => {
        drawing?.setNumCircles(numCircles);
    }, [numCircles]);



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    return (
        <div className="drawing-with-ft-container">
            <div className="text-container">
                <h2>Fourier Transform Geometry Visualization</h2>
                <p>
                    This tool visualizes a geometry based on a JSON file containing position data.
                    The file should be in the following format:
                </p>
                <pre>
                    {`[
    { "x": 187.86668395996094, "y": 45.199989318847656 },
    { "x": 189.34558832645416, "y": 45.72212503105402 },
    ...
]`}
                </pre>
                <p>
                    Using Fourier Transform, a chain of rotating arrows is generated.
                    Each arrow's base is positioned at the tip of the previous one, and the final arrow traces the geometry.
                    You can adjust the number of arrows and their speed with the sliders on the left.
                </p>
                <p>
                    You can also download an example file <a href="/drawing_data/monalisa.json" download="example.json" rel="noopener noreferrer">here</a>.
                </p>
            </div>


            <div className="controls">
                <div className="file-upload">
                    <input
                        type="file"
                        id="file-input"
                        accept=".json"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="file-input" className="custom-file-upload">
                        Choose JSON File
                    </label>
                </div>

                <div className="sliders">
                    <label htmlFor="slider1" className="slider-label"># Circles:</label>
                    <input
                        type="range"
                        id="slider1"
                        min="2"
                        max={`${NUM_CIRCLES_MAX}`}
                        value={numCircles}
                        onChange={(e) => setNumCircles(Number(e.target.value))}
                        className="slider"
                    />
                    <span>{numCircles}</span>

                    <label htmlFor="slider2" className="slider-label">Pace:</label>
                    <input
                        type="range"
                        id="slider2"
                        min="1"
                        max="10"
                        value={paceFactor}
                        onChange={(e) => setPaceFactor(Number(e.target.value))}
                        className="slider"
                    />
                    <span>{paceFactor}</span>
                </div>
            </div>

            <div className="file-upload-canvas-wrapper">
                <canvas ref={canvasRef} className="canvas"></canvas>
            </div>
        </div>
    );
};

export default DrawingWithFT;
