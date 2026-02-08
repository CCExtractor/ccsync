import { About } from './LandingComponents/About/About';
import { FAQ } from './LandingComponents/FAQ/FAQ';
import { Footer } from './LandingComponents/Footer/Footer';
import { Hero } from './LandingComponents/Hero/Hero';
import { HowItWorks } from './LandingComponents/HowItWorks/HowItWorks';
import { Navbar } from './LandingComponents/Navbar/Navbar';
import { ScrollToTop } from '../components/utils/ScrollToTop';
import { Contact } from './LandingComponents/Contact/Contact';
import '../App.css';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { url } from './utils/URLs';

export const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(url.backendURL + 'api/user', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          navigate('/home');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    checkLoginStatus();
  }, [navigate]);

  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <About />
      <HowItWorks />
      <Contact />
      <FAQ />
      <Footer />
      <ScrollToTop />
    </div>
  );
};
