import { Typewriter } from 'react-simple-typewriter';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo + Title */}
        <div className="flex items-center space-x-2">
          <div className="text-indigo-600 font-bold text-xl">✍️</div>
          <span className="text-xl font-semibold text-gray-800">HandwriteAI</span>
        </div>

        {/* Animated Text */}
        <div className="hidden md:block text-gray-700 text-center text-sm font-medium">
          <Typewriter
            words={[
              'Generate handwriting assignments effortlessly.',
              'Use real paper templates and fonts.',
              'Powered by GPT & min5!',
            ]}
            loop={0}
            cursor
            cursorStyle="|"
            typeSpeed={50}
            deleteSpeed={40}
            delaySpeed={2000}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="space-x-2 flex items-center">
          <Link
            to="/"
            className={`px-4 py-2 rounded-md font-medium ${
              location.pathname === '/' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Home
          </Link>

          <Link
            to="/auth"
            className={`px-4 py-2 rounded-md font-medium ${
              location.pathname === '/auth'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Login / Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
