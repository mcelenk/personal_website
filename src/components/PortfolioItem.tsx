import React, { ReactElement } from 'react';
import '../styles/PortfolioItem.css';

interface PortfolioItemProps {
    imageSrc: string;
    title: string;
    description: ReactElement;
    technologies?: string[];
    onClick?: () => void;
}

const PortfolioItem: React.FC<PortfolioItemProps> = ({ imageSrc, title, description, technologies, onClick }) => {
    return (
        <div className="portfolio-item" onClick={onClick}>
            <div className="portfolio-card">
                <img src={imageSrc} alt={`${title} screenshot`} className="portfolio-image" />
                <div className="portfolio-content">
                    <h3>{title}</h3>
                    <div>{description}</div>
                    {technologies && (
                        <ul className="portfolio-technologies">
                            {technologies.map((tech, index) => (
                                <li key={index}>{tech}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortfolioItem;
