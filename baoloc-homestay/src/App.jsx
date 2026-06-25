import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Detail from './pages/Detail';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Invoice from './pages/Invoice';

import GlobalBackButton from './components/GlobalBackButton';

function App() {
  return (
    <BrowserRouter>
      <GlobalBackButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/search" element={<Search />} />
        <Route path="/homestay/:id" element={<Detail />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/invoice/:id" element={<Invoice />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
