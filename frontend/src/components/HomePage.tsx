import React, { useState, useEffect, useRef } from 'react';
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
import { Task } from '@/components/utils/types';
import { fetchTaskwarriorTasks } from './HomeComponents/Tasks/hooks';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export const HomePage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const hasTourStartedRef = useRef(false);
  const tourTimeoutRef = useRef<number | null>(null);

  const getTasks = async (
    email: string,
    encryptionSecret: string,
    UUID: string
  ) => {
    setIsLoading(true);
    try {
      const fetchedTasks = await fetchTaskwarriorTasks({
        email,
        encryptionSecret,
        UUID,
        backendURL: url.backendURL,
      });
      setTasks(fetchedTasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to fetch tasks. Please check your connection.', {
        position: 'bottom-left',
        // ... toast config
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Launch onboarding tour for new HomePage visitors.
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

    if (userInfo.email && userInfo.encryption_secret && userInfo.uuid) {
      getTasks(userInfo.email, userInfo.encryption_secret, userInfo.uuid);
    }

    console.log('Setting up WebSocket with clientID:', userInfo.uuid);
    const socketURL = `${url.backendURL.replace(/^http/, 'ws')}ws?clientID=${userInfo.uuid}`;
    const socket = new WebSocket(socketURL);

    socket.onopen = () => console.log('WebSocket connected!');

    socket.onmessage = (event) => {
      // console.log("Message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'success') {
          getTasks(userInfo.email, userInfo.encryption_secret, userInfo.uuid);
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

  useEffect(() => {
    if (!userInfo?.email) {
      return;
    }

    if (hasTourStartedRef.current) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const tourStorageKey = `ccsync-home-tour-${userInfo.email}`;
    if (window.localStorage.getItem(tourStorageKey) === 'seen') {
      hasTourStartedRef.current = true;
      return;
    }

    const markTourSeen = () => {
      window.localStorage.setItem(tourStorageKey, 'seen');
    };

    const driverInstance = driver({
      popoverClass: 'ccsync-tour-popover',
      showProgress: true,
      overlayOpacity: 0.45,
      stagePadding: 8,
      allowClose: true,
      showButtons: ['previous', 'next', 'close'],
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Finish',
      steps: [
        {
          element: '#home-navbar',
          popover: {
            title: 'Navigation hub',
            description:
              'Find task actions, logs, and your account controls from the top bar.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#home-hero',
          popover: {
            title: userInfo.name ? `Welcome, ${userInfo.name.split(' ')[0]}!` : 'Welcome to CCSync',
            description:
              'Kick off sync jobs, copy credentials, and review your Taskwarrior status from here.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#home-tasks',
          popover: {
            title: 'Live task board',
            description:
              'View, edit, complete, or delete Taskwarrior items and watch updates stream in real time.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#home-setup-guide',
          popover: {
            title: 'Setup guide',
            description:
              'Follow these steps to connect Taskwarrior and keep CCSync working across your devices.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#home-faq',
          popover: {
            title: 'Need help?',
            description:
              'The FAQ covers common troubleshooting tips. Reach out if you still need a hand.',
            side: 'top',
            align: 'start',
          },
        },
      ],
      onDestroyed: () => {
        markTourSeen();
      },
      onCloseClick: () => {
        markTourSeen();
        driverInstance.destroy();
      },
      onPopoverRender: (popover) => {
        if (!popover.footerButtons.querySelector('[data-driver-skip-button]')) {
          const skipButton = document.createElement('button');
          skipButton.type = 'button';
          skipButton.textContent = 'Skip';
          skipButton.dataset.driverSkipButton = 'true';
          skipButton.className = 'driver-skip-btn';
          skipButton.addEventListener('click', () => {
            markTourSeen();
            driverInstance.destroy();
          });
          popover.footerButtons.prepend(skipButton);
        }
      },
    });

    hasTourStartedRef.current = true;

    tourTimeoutRef.current = window.setTimeout(() => {
      driverInstance.drive();
    }, 600);

    return () => {
      if (tourTimeoutRef.current) {
        window.clearTimeout(tourTimeoutRef.current);
        tourTimeoutRef.current = null;
      }

      if (driverInstance.isActive()) {
        driverInstance.destroy();
      }
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
          <div id="home-navbar">
            <Navbar
              tasks={tasks}
              imgurl={userInfo.picture}
              email={userInfo.email}
              encryptionSecret={userInfo.encryption_secret}
              origin={url.containerOrigin}
              UUID={userInfo.uuid}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
          <motion.div
            id="home-hero"
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
          <section id="home-tasks">
            <Tasks
              email={userInfo.email}
              encryptionSecret={userInfo.encryption_secret}
              origin={url.containerOrigin}
              UUID={userInfo.uuid}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </section>
          <section id="home-setup-guide">
            <SetupGuide
              name={userInfo.name}
              uuid={userInfo.uuid}
              encryption_secret={userInfo.encryption_secret}
            />
          </section>
          <section id="home-faq">
            <FAQ />
          </section>
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
