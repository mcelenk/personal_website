import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from './AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import { ObjectId } from 'mongodb';
import { ACTIVE_ALLOWED_GAME_COUNT } from '../gameplay/constants';

import '../styles/GameList.css';
import '../styles/Common.css';

interface Game {
    gameId: string,
    gameName: string,
    isCurrent: boolean,
}

interface Notification {
    _id: ObjectId,
    message: string
}

const GameList: React.FC = () => {
    const [games, setGames] = useState<Array<Game>>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

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
                console.error(err);
            };
        };
    }

    const fetchData = async (user: { sub: string }) => {
        try {
            const response = await fetch(`/.netlify/functions/getCurrentUsersGamesAndNotifications?userId=${user.sub}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setGames(data.gameTurns);
            data.notifications.forEach((notification: Notification) => {
                toast(notification.message, { autoClose: 5000 });
            });
            markNotificationsAsRead(data.notifications.map((n: Notification) => n._id));
        } catch (err) {
            setError('Error fetching game data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(user);
        const interval = setInterval(() => { fetchData(user) }, 10000);
        return () => clearInterval(interval);
    }, [user]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }
    return (
        <>
            <div className="button-container absolute-positioning">
                {games.length < ACTIVE_ALLOWED_GAME_COUNT && (<button className="common-button" onClick={() => navigate('/create')}>Create a new game</button>)}
            </div>
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
