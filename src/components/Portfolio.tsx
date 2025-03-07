import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import PortfolioItem from './PortfolioItem';
import '../styles/Portfolio.css';

interface PortfolioItemType {
    imageSrc: string;
    title: string;
    description: ReactElement;
    technologies?: string[];
    navigateTo: string; // Add navigateTo property for navigation
}

const Portfolio: React.FC = () => {
    const navigate = useNavigate();

    const portfolioItems: PortfolioItemType[] = [
        {
            imageSrc: '/assets/dwft.gif',
            title: 'Drawing With Fourier Transform',
            description: <>Inspired by 3Blue1Brown's <a href="https://www.youtube.com/watch?v=spUNpyF58BY" target="_blank" rel="noopener noreferrer">videos</a>,
                and a will to learn a bit about <a href="http://paperjs.org/" target="_blank" rel="noopener noreferrer">PaperJS</a>,
                I created this project to visualize how a complex shape can be represented by a sum of simpler shapes using Fourier Transform.</>,
            technologies: ['PaperJS', 'HTML Canvas', 'Typescript'],
            navigateTo: '/project1', // Define the navigation path
        },
        {
            imageSrc: 'path/to/your/image2.png', // Replace with your image paths
            title: 'Project 2',
            description: <>This is my take on implementing a turn-based strategy game. Inspired by a classic Android game, I developed an online version for two players.
                This web-based version offers seamless and engaging gameplay, capturing the essence of the original.
                Original game developed by <a href="https://play.google.com/store/apps/details?id=yio.tro.antiyoy.android" target="_blank" rel="noopener noreferrer">yiotro.</a></>,
            technologies: ['HTML Canvas', 'Serverless Functions', 'MongoDB'],
            navigateTo: '/games',
        },
        // Add more portfolio items as needed
    ];

    return (
        <div className="portfolio-container">
            {portfolioItems.map((item, index) => (
                <PortfolioItem
                    key={index}
                    imageSrc={item.imageSrc}
                    title={item.title}
                    description={item.description}
                    technologies={item.technologies}
                    onClick={() => navigate(item.navigateTo)} // Handle navigation on click
                />
            ))}
        </div>
    );
};

export default Portfolio;
