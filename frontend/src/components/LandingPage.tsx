import { About } from './LandingComponents/About/About';
import { FAQ } from './LandingComponents/FAQ/FAQ';
import { Footer } from './LandingComponents/Footer/Footer';
import { Hero } from './LandingComponents/Hero/Hero';
import { HowItWorks } from './LandingComponents/HowItWorks/HowItWorks';
import { Navbar } from './LandingComponents/Navbar/Navbar';
import { ScrollToTop } from '../components/utils/ScrollToTop';
import { Contact } from './LandingComponents/Contact/Contact';
import '../App.css';

export const LandingPage = () => {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <div className="pt-16">
        <Hero />
        <About />
        <HowItWorks />
        <Contact />
        <FAQ />
        <Footer />
        <ScrollToTop />
      </div>
    </div>
  );
};
