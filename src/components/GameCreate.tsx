import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapSize } from '../gameplay/mapGenerator';
import '../styles/Common.css';
import '../styles/GameCreate.css';


interface Player {
    userId: string;
    name: string;
}

interface MapType {
    key: MapSize;
    label: string;
}

const mapTypes: MapType[] = [
    { key: MapSize.SMALL, label: 'Small' },
    { key: MapSize.MEDIUM, label: 'Medium' },
    { key: MapSize.LARGE, label: 'Large' },
];

const GameCreate: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<string>('');
    const [selectedMapSize, setSelectedMapSize] = useState<MapSize>(MapSize.SMALL);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [createGameButtonDisabled, setCreateGameButtonDisabled] = useState<boolean>(true);

    useEffect(() => {

        const fetchUsers = async () => {
            try {
                const response = await fetch(`/.netlify/functions/getAllUsers?userId=${user.sub}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPlayers(data);
            } catch (err) {
                setError('Error fetching game data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [user]);

    const handleCreateGame = async () => {

        const createGame = async (item: any): Promise<void> => {
            try {
                const response = await fetch('/.netlify/functions/createGame', {
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
                navigate('/games');

            } catch (error) {
                console.error('Error:', error);
            }
        };
        await createGame({
            userId: user.sub,
            opponentId: selectedPlayer,
            mapSize: selectedMapSize,
        });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h2>Create a New Game</h2>

            <label>
                Choose Opponent:
                <select
                    value={selectedPlayer}
                    onChange={e => { setSelectedPlayer(e.target.value); setCreateGameButtonDisabled(false); }}>
                    <option value="">Select a player</option>
                    {players.map(player => (
                        <option key={player.userId} value={player.userId}>
                            {player.name}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Choose Map Type:
                <select
                    value={selectedMapSize}
                    onChange={e => setSelectedMapSize(parseInt(e.target.value))}
                >
                    {mapTypes.map(map => (
                        <option key={map.key} value={map.key}>
                            {map.label}
                        </option>
                    ))}
                </select>
            </label>

            <button className="relative-button" onClick={() => { setCreateGameButtonDisabled(false); handleCreateGame(); }} disabled={createGameButtonDisabled}>Create Game</button>
            <button className="relative-button" onClick={() => navigate('/games')}>Back to Game List</button>
        </div>
    );
};

export default GameCreate;