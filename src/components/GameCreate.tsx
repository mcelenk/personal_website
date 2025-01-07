import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapSize } from '../gameplay/mapGenerator';
import '../styles/Common.css';
import '../styles/GameCreate.css';


interface Player {
    id: string;
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
    const [selectedMapSize, setSelectedMapSize] = useState<string>('small');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setPlayers([
            { id: "asdsadasd", name: "Yanni yanni yannn" },
            { id: "asdfad331", name: "Yunnu yunnu yun" },
            { id: "asdasee12", name: "Etszgy etgyyy etsy" },
            { id: "115640007776032459832", name: "Mustafa Celebioglu" },
        ].filter(x => x.id != user.sub));
    }, [user]);

    const handleCreateGame = () => {

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
        createGame({
            userId: user.sub,
            opponentId: selectedPlayer,
            mapSize: selectedMapSize,
        });
    };

    return (
        <div>
            <h2>Create a New Game</h2>

            <label>
                Choose Opponent:
                <select
                    value={selectedPlayer}
                    onChange={e => setSelectedPlayer(e.target.value)}
                >
                    <option value="">Select a player</option>
                    {players.map(player => (
                        <option key={player.id} value={player.id}>
                            {player.name}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Choose Map Type:
                <select
                    value={selectedMapSize}
                    onChange={e => setSelectedMapSize(e.target.value)}
                >
                    {mapTypes.map(map => (
                        <option key={map.key} value={map.key}>
                            {map.label}
                        </option>
                    ))}
                </select>
            </label>

            <button className="back-button" onClick={handleCreateGame} disabled={!selectedPlayer}>Create Game</button>
        </div>
    );
};

export default GameCreate;