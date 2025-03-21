import React, { useContext, useEffect } from 'react';
import Navbar from '../components/home/Navbar';
import HeroSection from '../components/home/HeroSection';
import CollaborationSection from '../components/home/CollaborationSection';
import AboutUsSection from '../components/home/AboutUsSection';
import CampaignsSection from '../components/home/CampaignsSection';
import OurFeatureSection from '../components/home/OurFeatureSection';
import ChooseUsSection from '../components/home/ChooseUsSection';
import Testimonials from '../components/home/Testimonials';
import Footer from '../components/home/Footer';
import FAQsSection from '../components/home/FAQsSection';
import { ToastContainer } from 'react-toastify';
import { AuthContext } from '../context/userContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
  profilePicture: "";
}


const Home: React.FC = () => {
  const { login } = useContext(AuthContext)!;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        console.log(decodedUser);
        login(decodedUser as User, token);
        navigate('/'); // Redirect to homepage without the token in the URL
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }, [location]);


  return <div className=''>
    <Navbar />
    <HeroSection />
    <CollaborationSection />
    <AboutUsSection />
    <CampaignsSection />
    <ChooseUsSection />
    <OurFeatureSection />
    <Testimonials />
    <FAQsSection />
    {/* <Footer /> */}
  </div>;
};

export default Home;
