import React, { useEffect, useRef, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Game } from '../gameplay/game';
import '../styles/GameScreen.css';

const GameScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const canvasBackRef = useRef<HTMLCanvasElement>(null);
    const canvasFrontRef = useRef<HTMLCanvasElement>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [game, setGame] = useState<Game | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const url = `/data/${id}.json`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const gameData = await response.json();
                if (gameData.players.includes(user.sub)) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (err) {
                console.error('Error fetching game details:', err);
                setError('Failed to fetch game details. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchGameData();
    }, [id, user]);

    useEffect(() => {
        if (isAuthorized && canvasBackRef.current && canvasFrontRef.current && !game) {
            const initializeGame = async () => {
                try {
                    const url = `/data/${id}.json`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const gameData = await response.json();
                    const gameInstance = new Game(canvasBackRef.current!, canvasFrontRef.current!, gameData);
                    setGame(gameInstance);
                } catch (err) {
                    console.error('Error initializing game:', err);
                }
            };

            initializeGame();
        }
    }, [isAuthorized, canvasBackRef, canvasFrontRef, id, game]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthorized) {
        return <Navigate to="/games" />;
    }
    return (
        <div>
            <button className="back-button" onClick={() => navigate('/games')}>Back to Game List</button>
            <canvas ref={canvasBackRef} id="back" width={window.innerWidth} height={window.innerHeight}></canvas>
            <canvas ref={canvasFrontRef} id="front" width={window.innerWidth} height={window.innerHeight}></canvas>
        </div>
    );
};
export default GameScreen;