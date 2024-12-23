import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
    user: any;
    setUser: (user: any) => void;
}

interface AuthProviderProps {
    children: ReactNode; // This defines the type for children
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState(null);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
