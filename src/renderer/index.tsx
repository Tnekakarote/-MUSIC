import React from 'react';
import ReactDOM from 'react-dom/client';
import Player from './components/Player';
import './styles/global.css';

const App = () => (
  <div className="app">
    <h1>K4KAKAROTE MUSIC</h1>
    <Player />
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
