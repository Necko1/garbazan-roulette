import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Roulette from './Roulette.js';

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roulette" element={<Roulette />} />
        </Routes>
      </Router>
  );
}

export default App;