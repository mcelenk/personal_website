import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../styles/GameList.css';
import '../styles/Common.css';

interface Game {
    gameId: string,
    gameName: string,
    isCurrent: boolean,
}

const GameList: React.FC = () => {
    const [games, setGames] = useState<Array<Game>>([]);
    const [loading, setLoading] = useState<boolean>(true);
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
                setLoading(false);
            }
        };

        fetchGames();
    }, [user]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }
    return (
        <>
            <button className="common-button" onClick={() => navigate('/create')}>Create a new game</button>
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
        </>
    );
};

export default GameList;
