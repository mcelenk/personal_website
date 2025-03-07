import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Common.css';

const About: React.FC = () => {
    return (
        <div className='text-container'>
            <h1>About Me</h1>
            <p>
                Hey, there! My name’s <Link to="/cv">Mustafa Çelenk</Link>. I'm a software engineer based in Amsterdam with a passion for creating efficient and scalable solutions.
            </p>
            <p>
                This is my space to share thoughts, projects, and insights as I journey through my field. Whether it’s a new technology, a creative project, or just something cool I stumbled upon, I try to write here regularly.
            </p>
            <p>
                When I’m not coding, you might find me watching football games, dreaming about solving hardest football analytics problems and reading sci-fi.
            </p>
            <p>
                Feel free to shoot me an <a href="mailto:mcelenk@dottilde.com">email</a>.
            </p>
        </div>
    );
};

export default About; 