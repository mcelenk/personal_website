import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const clientId = '156611515968-i72vifujdb8pqdnl2mnb1lqqp4mvhtu8.apps.googleusercontent.com';
const Login: React.FC = () => {
    const { setUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Check if the user is already logged in
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            navigate('/games');
        }
    }, [navigate, setUser]);

    const onSuccess = async (response: CredentialResponse) => {

        const addUser = async (item: { userId: string; name: string; email: string }): Promise<void> => {
            try {
                const response = await fetch('/.netlify/functions/CheckAndInsertGameUser', {
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

        if (response.credential) {
            const user = jwtDecode(response.credential);
            localStorage.setItem('user', JSON.stringify(user));
            const obj = JSON.parse(localStorage.getItem('user')!);
            setUser(user);
            await addUser({
                userId: obj.sub,
                name: obj.name,
                email: obj.email
            });
            navigate('/games');
        }
    };

    const onFailure = () => {
        console.log('Login Failed');
        setUser(null);
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <GoogleLogin
                onSuccess={onSuccess}
                onError={onFailure}
            />
        </GoogleOAuthProvider>
    );
};

export default Login;
