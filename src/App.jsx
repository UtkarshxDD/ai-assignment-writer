import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainPage from './components/MainPage';
import LoginPage from './components/LoginPage'
function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<MainPage/>} />
          <Route path="/auth" element={<LoginPage/>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
