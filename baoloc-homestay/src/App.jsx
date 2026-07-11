import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Detail from './pages/Detail';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Invoice from './pages/Invoice';
import Promotions from './pages/Promotions';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CancellationPolicy from './pages/CancellationPolicy';
import PaymentGuide from './pages/PaymentGuide';
import FAQ from './pages/FAQ';

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
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />
        <Route path="/payment-guide" element={<PaymentGuide />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
