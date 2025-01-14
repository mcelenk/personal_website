import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from './AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/GameList.css';
import '../styles/Common.css';
import { ObjectId } from 'mongodb';
import { ACTIVE_ALLOWED_GAME_COUNT } from '../gameplay/constants';

interface Game {
    gameId: string,
    gameName: string,
    isCurrent: boolean,
}

interface Notification {
    _id: ObjectId,
    gameName: string,
    message: string
}

const GameList: React.FC = () => {
    const [games, setGames] = useState<Array<Game>>([]);
    const [notifications, setNotifications] = useState<Array<Notification>>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [gamesLoaded, setGamesLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch(`/.netlify/functions/getCurrentUsersGames?userId=${user.sub}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setGames(data);
            } catch (err) {
                setError('Error fetching game data');
                console.error(err);
            } finally {
                setGamesLoaded(true);
            }
        };

        fetchGames();
    }, [user]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (gamesLoaded) {
                try {
                    const response = await fetch(`/.netlify/functions/getGameNotifications?userId=${user.sub}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data: Array<Notification> = await response.json();
                    (window as any).nd = data;
                    setNotifications(data);

                    const notificationIds = data.map((x: Notification) => x._id);
                    data.forEach((notification) => { toast(notification.message, { autoClose: 5000 }); });
                    markNotificationsAsRead(notificationIds);

                } catch (err) {
                    setError('Error fetching notifications data');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        };

        const markNotificationsAsRead = async (notificationIds: Array<ObjectId>) => {
            if (notificationIds && notificationIds.length > 0) {
                try {
                    await fetch('/.netlify/functions/markNotificationsRead', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ notificationIds }),
                    });
                } catch (err) {
                    // setError('Error updating notifications data');
                    console.error(err);
                };
            };
        }

        fetchNotifications();
    }, [user, gamesLoaded]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }
    return (
        <>
            {games.length < ACTIVE_ALLOWED_GAME_COUNT && (<button className="common-button" onClick={() => navigate('/create')}>Create a new game</button>)}
            <div className="game-list-container">
                <h2>Available Games</h2>
                <ul className="game-list">
                    {games.map(game => (
                        <li key={game.gameId} className="game-item" onClick={() => navigate(`/game/${game.gameId}`)}>
                            <div className={`game-card ${game.isCurrent ? '' : 'inactive'}`}>
                                <h3>Game Name: {game.gameName ? game.gameName : game.gameId}</h3>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <ToastContainer />
        </>
    );
};

export default GameList;
