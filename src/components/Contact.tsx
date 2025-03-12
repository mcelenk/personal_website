import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className='text-container'>
      <h1>Contact</h1>
      <p>Amsterdam, The Netherlands</p>
      <p>
        <a href="mailto:mcelenk@dottilde.com">mcelenk@dottilde.com</a>
      </p>
      <p>
        <a href="https://www.dottilde.com" target="_blank" rel="noopener noreferrer">Dev Blog</a>
      </p>
      <p>
        <a href="https://github.com/mcelenk" target="_blank" rel="noopener noreferrer">GitHub</a>
      </p>
      <p>
        <a href="https://www.linkedin.com/in/mcelenk" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </p>
    </div>
  );
};

export default Contact;
