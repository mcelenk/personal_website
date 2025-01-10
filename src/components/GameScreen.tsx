import React, { useEffect, useRef, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Game } from '../gameplay/game';
import '../styles/Common.css';
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
    const [gameData, setGameData] = useState<any | null>(null);
    const [serializationData, setSerializationData] = useState<any | null>(null);

    const [isAwaiting, setIsAwaiting] = useState(false);

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const response = await fetch(`/.netlify/functions/getGameState?gameId=${id}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const gameData = data.gameData;
                if (gameData.players.includes(user.sub)) {
                    setIsAuthorized(true);
                    setGameData(gameData);
                    setIsAwaiting(gameData.currentUserId !== user.sub);
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
        if (isAuthorized && canvasBackRef.current && canvasFrontRef.current && gameData && !game) {
            const initializeGame = async () => {
                try {
                    const gameInstance = new Game(canvasBackRef.current!, canvasFrontRef.current!, user.sub, gameData, isAwaiting, (data: any) => {
                        setSerializationData(data);
                    });
                    setGame(gameInstance);
                } catch (err) {
                    console.error('Error initializing game:', err);
                }
            };

            initializeGame();
        }
    }, [isAuthorized, canvasBackRef, canvasFrontRef, gameData, game]);

    useEffect(() => {
        if (serializationData) {
            const saveGame = async (item: any): Promise<void> => {
                try {
                    const response = await fetch('/.netlify/functions/saveGameState', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(item),
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Success:', data);
                } catch (error) {
                    console.error('Error:', error);
                }
            }
            saveGame(serializationData);
        }
    }, [serializationData]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthorized) {
        return <Navigate to="/games" />;
    }
    return (
        <div>
            <button className="common-button" onClick={() => navigate('/games')}>Back to Game List</button>
            <canvas ref={canvasBackRef} id="back" width={window.innerWidth} height={window.innerHeight}></canvas>
            <canvas ref={canvasFrontRef} id="front" width={window.innerWidth} height={window.innerHeight}></canvas>
            {isAwaiting && (<div className="awaiting-message show"> Awaiting your opponent(s) </div>)}
        </div>
    );
};
export default GameScreen;