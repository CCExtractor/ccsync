import React, { useState, useEffect } from "react";
import { Navbar } from "./HomeComponents/Navbar/Navbar";
import { Hero } from "./HomeComponents/Hero/Hero";
import { Footer } from "./HomeComponents/Footer/Footer";
import { SetupGuide } from "./HomeComponents/SetupGuide/SetupGuide";
import { FAQ } from "./HomeComponents/FAQ/FAQ";
import { Tasks } from "./HomeComponents/Tasks/Tasks";
import { url } from "@/components/utils/URLs";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

export const HomePage: React.FC = () => {
    const [userInfo, setUserInfo] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await fetch(url.backendURL + "api/user", {
                method: "GET",
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                setUserInfo(data);
            } else {
                console.error("Failed to fetch user info");
                navigate('/');
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
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
                    />
                    <motion.div
                        initial={{ x: -1000 }}
                        animate={{ x: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
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
                    />
                    <SetupGuide
                        name={userInfo.name}
                        uuid={userInfo.uuid}
                        encryption_secret={userInfo.encryption_secret}
                    />
                    <FAQ />
                    <Footer />
                </div>
            ) : (<div>
                <p>Session has been expired.</p>
                <p>Please to go back to the
                    <a color="red" href={url.frontendURL}> home page </a>
                    and sign in again</p>
            </div>
            )}
        </div >
    );
};
