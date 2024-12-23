import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GameList.css';
import { useAuth } from './AuthContext';

interface Game {
    gameId: string,
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
                const userId = "asdf";
                const response = await fetch(`/.netlify/functions/getGameUsers?userId=${user.sub}`);
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
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }
    return (
        <div className="game-list-container">
            <h2>Available Games</h2>
            <ul className="game-list">
                {games.map(game => (
                    <li key={game.gameId} className="game-item" onClick={() => navigate(`/game/${game.gameId}`)}>
                        <div className="game-card">
                            <h3>Game ID: {game.gameId}</h3>
                            {/* Add any other game details you want to display here */}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GameList;
