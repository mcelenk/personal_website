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

    const onSuccess = (response: CredentialResponse) => {
        // You can also handle the ID token for backend verification
        if (response.credential) {
            const user = jwtDecode(response.credential);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(JSON.parse(localStorage.getItem('user')!));
            (window as any).user = user;
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
