import React, { useState, useEffect } from 'react';
import { Navbar } from './HomeComponents/Navbar/Navbar';
import { Hero } from './HomeComponents/Hero/Hero';
import { Footer } from './HomeComponents/Footer/Footer';
import { SetupGuide } from './HomeComponents/SetupGuide/SetupGuide';
import { FAQ } from './HomeComponents/FAQ/FAQ';
import { Tasks } from './HomeComponents/Tasks/Tasks';
import { url } from '@/components/utils/URLs';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export const HomePage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!userInfo || !userInfo.uuid) {
      console.log(
        'User info or UUID is not available yet, skipping WebSocket setup.'
      );
      return;
    }

    console.log('Setting up WebSocket with clientID:', userInfo.uuid);
    const socketURL = `${url.backendURL.replace(/^http/, 'ws')}ws?clientID=${userInfo.uuid}`;
    const socket = new WebSocket(socketURL);

    socket.onopen = () => console.log('WebSocket connected!');

    socket.onmessage = (event) => {
      // console.log("Message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'in-progress' || data.status === 'queued') {
          // console.log("Loading...");
          // console.log(data.job);
        } else if (data.status === 'success') {
          if (data.job === 'Add Task') {
            console.log('Task added successfully');
            toast.success('Task added successfully!', {
              position: 'bottom-left',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          } else if (data.job === 'Edit Task') {
            console.log('Task edited successfully');
            toast.success('Task edited successfully!', {
              position: 'bottom-left',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          } else if (data.job == 'Complete Task') {
            toast.success('Task marked as completed successfully!', {
              position: 'bottom-left',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          } else if (data.job == 'Delete Task') {
            toast.success('Task marked as deleted successfully!', {
              position: 'bottom-left',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          }
        } else if (data.status == 'failure') {
          console.log(`Failed to ${data.job || 'perform action'}`);
          toast.error(`Failed to ${data.job || 'perform action'}`, {
            position: 'bottom-left',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
      } catch (error) {
        console.error('Failed to parse message data:', error);
      }
    };

    socket.onclose = () => console.log('WebSocket disconnected.');
    socket.onerror = (error) => console.error('WebSocket error:', error);

    return () => {
      console.log('Cleaning up WebSocket...');
      socket.close();
    };
  }, [userInfo]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(url.backendURL + 'api/user', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      } else {
        console.error('Failed to fetch user info');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      navigate('/');
    }
  };

  return (
    <div>
      {userInfo ? (
        <div>
          <Navbar
            imgurl={userInfo.picture}
            email={userInfo.email}
            encryptionSecret={userInfo.encryption_secret}
            origin={url.containerOrigin}
            UUID={userInfo.uuid}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          <motion.div
            initial={{ x: -1000 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Hero
              name={userInfo.name}
              uuid={userInfo.uuid}
              encryption_secret={userInfo.encryption_secret}
            />
          </motion.div>
          <Tasks
            email={userInfo.email}
            encryptionSecret={userInfo.encryption_secret}
            origin={url.containerOrigin}
            UUID={userInfo.uuid}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          <SetupGuide
            name={userInfo.name}
            uuid={userInfo.uuid}
            encryption_secret={userInfo.encryption_secret}
          />
          <FAQ />
          <Footer />
        </div>
      ) : (
        <div>
          <p>Session has been expired.</p>
          <p>
            Please to go back to the
            <a color="red" href={url.frontendURL}>
              {' '}
              home page{' '}
            </a>
            and sign in again
          </p>
        </div>
      )}
    </div>
  );
};
