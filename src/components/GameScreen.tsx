import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ConfirmModal from './ConfirmModal';
import { Game } from '../gameplay/game';

import gifshot from 'gifshot';

import '../styles/Common.css';
import '../styles/GameScreen.css';

enum NotificationType {
    GAME_END = 0,
    RESIGNATION = 1,
}

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
    const [gameDataUpdated, setGameDataUpdated] = useState<boolean>(false);
    const [serializationData, setSerializationData] = useState<any | null>(null);
    const [showAwaiting, setShowAwaiting] = useState(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [buttonsDisabled, setButtonsDisabled] = useState<boolean>(false);
    const [latestDt, setLatestDt] = useState<Date | null>(null);

    const useAsyncCallback = () => {
        const [isExecuting, setIsExecuting] = useState(false);
        const executeAsync = useCallback(async (callback: () => Promise<void>) => {
            setIsExecuting(true);
            try {
                await callback();
            } catch (error) {
                console.error('Error in async operation:', error);
            } finally {
                setIsExecuting(false);
            }
        }, []);
        return { executeAsync, isExecuting };
    };
    const { executeAsync, isExecuting } = useAsyncCallback();
    const gameEndCallback = () => {
        executeAsync(async () => {
            await notifyAndNavigate(NotificationType.GAME_END);
        });
    };

    const notifyAndNavigate = async (type: NotificationType): Promise<void> => {
        await createNotifications(type);
        setTimeout(() => {
            navigate('/games')
        }, 1000);
    }

    const createNotifications = async (type: NotificationType): Promise<void> => {
        const gameName = gameData.gameName;
        const notifications = [];

        switch (type) {
            case NotificationType.GAME_END:
                notifications.push({
                    userId: user.sub,
                    message: `Congratulations, you won the game ${gameName}`,
                });
                notifications.push({
                    userId: gameData.players.filter((x: string) => x !== user.sub)[0],
                    message: `You've lost the game ${gameName}, better luck next time!`,
                });
                break;
            case NotificationType.RESIGNATION:
                notifications.push({
                    userId: user.sub,
                    message: `You've resigned from the game ${gameName}`,
                });
                notifications.push({
                    userId: gameData.players.filter((x: string) => x !== user.sub)[0],
                    message: `Because your opponent(s) resigned, you've won the game ${gameName}`,
                });
                break;
            default:
                throw Error(`Unknown notification type: ${type}!`);
        }

        try {
            const response = await fetch('/.netlify/functions/createGameNotification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notifications: notifications, gameId: gameData.id }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Success:', data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleResign = () => {
        setShowModal(true);
    }

    const handleConfirmResign = async (): Promise<void> => {
        // actual handling of resignation
        game?.stopGame();
        setButtonsDisabled(true);
        setShowModal(false);
        await notifyAndNavigate(NotificationType.RESIGNATION);
    }

    const handleCancelResign = () => {
        setShowModal(false);
    }

    const fetchGameData = async () => {
        try {
            const response = await fetch(`/.netlify/functions/getGameState?gameId=${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (latestDt != data.insertDt) {
                const gameData = data.gameData;
                if (gameData.players.includes(user.sub)) {
                    setIsAuthorized(true);
                    setGameData(gameData);
                    setShowAwaiting(gameData.currentUserId !== user.sub);
                } else {
                    setIsAuthorized(false);
                }
                setLatestDt(data.insertDt);
                setGameDataUpdated(true);
            }
        } catch (err) {
            console.error('Error fetching game details:', err);
            setError('Failed to fetch game details. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGameData();
        const interval = setInterval(() => {
            if (isAuthorized) {
                fetchGameData();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [id, user, isAuthorized, gameData]);

    useEffect(() => {
        if (isAuthorized && canvasBackRef.current && canvasFrontRef.current && gameData && gameDataUpdated) {

            const endGameHook = (): void => {
                gameEndCallback();
            };

            const saveGameHook = (data: any) => {
                setSerializationData(data);
            };

            const initializeGame = async () => {
                try {
                    game?.dispose();
                    const gameInstance = new Game(
                        canvasBackRef.current!,
                        canvasFrontRef.current!,
                        user.sub,
                        gameData,
                        saveGameHook,
                        endGameHook
                    );
                    setGameDataUpdated(false);

                    gameInstance.initialize(showAwaiting, (state: boolean) => {
                        setShowAwaiting(state);
                    }).then(() => {
                        setGame(gameInstance);
                        gameInstance.gameLoop();
                    });
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

    const captureAnimation = () => {
        const combinedCanvas = document.createElement('canvas');
        const combinedContext = combinedCanvas.getContext('2d', { willReadFrequently: true })!;
        combinedCanvas.width = canvasBackRef.current!.width;
        combinedCanvas.height = canvasBackRef.current!.height;
        combinedContext.drawImage(canvasBackRef.current!, 0, 0);
        combinedContext.drawImage(canvasFrontRef.current!, 0, 0);

        const canvas = combinedCanvas;
        const frames: string[] = [];
        const duration = 6000; // Capture duration in milliseconds
        const frameRate = 5; // Lower the frame rate to reduce size (e.g., 5 frames per second)
        const totalFrames = (duration / 1000) * frameRate;

        const captureFrame = (frameCount: number) => {
            if (frameCount >= totalFrames) {
                gifshot.createGIF(
                    {
                        images: frames,
                        gifWidth: canvas.width / 4, // Reduce resolution by half
                        gifHeight: canvas.height / 4, // Reduce resolution by half
                        interval: 1 / frameRate,
                        numWorkers: 2,
                        numFrames: totalFrames,
                        sampleInterval: 10, // Increase sample interval to reduce size
                    },
                    (obj) => {
                        if (!obj.error) {
                            const image = obj.image;
                            const a = document.createElement('a');
                            a.href = image!;
                            a.download = 'animation.gif';
                            a.click();
                        }
                    }
                );
                return;
            }

            frames.push(canvas.toDataURL('image/png'));
            setTimeout(() => captureFrame(frameCount + 1), 1000 / frameRate);
        };

        captureFrame(0);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!isAuthorized) {
        return <Navigate to="/games" />;
    }
    return (
        <div>
            <div className="button-container absolute-positioning">
                <button className="common-button" onClick={() => navigate('/games')}>Back to Game List</button>
                <button className='common-button' disabled={buttonsDisabled} onClick={handleResign}>Resign</button>
                <button onClick={captureAnimation}>Capture Animation</button>
            </div>
            <canvas ref={canvasBackRef} id="back" width={window.innerWidth} height={window.innerHeight}></canvas>
            <canvas ref={canvasFrontRef} id="front" width={window.innerWidth} height={window.innerHeight}></canvas>
            {showAwaiting && (<div className="awaiting-message show"> Awaiting your opponent(s) </div>)}

            <ConfirmModal show={showModal} onClose={handleCancelResign} onConfirm={handleConfirmResign} />
        </div>
    );
};
export default GameScreen;