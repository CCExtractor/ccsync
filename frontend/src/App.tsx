import { HomePage } from './components/HomePage';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
