import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        Image to Prompt Generator
      </h1>
      <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
        Upload an image and let Gemini craft the perfect, detailed prompt for any AI image generation model.
      </p>
    </header>
  );
};

export default Header;