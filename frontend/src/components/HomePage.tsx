import React, { useState, useEffect } from "react";
import { Navbar } from "./HomeComponents/Navbar_HP";
import { Hero } from "./HomeComponents/Hero_HP";
import { Footer } from "./HomeComponents/Footer_HP";
import { SetupGuide } from "./HomeComponents/SetupGuide_HP";
import { FAQ } from "./HomeComponents/FAQ_HP";
import { Tasks } from "./HomeComponents/Tasks_HP";

export const HomePage: React.FC = () => {
    const [userInfo, setUserInfo] = useState<any>(null);
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const frontendURL = import.meta.env.VITE_FRONTEND_URL;
    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            0
            const response = await fetch(backendURL + "api/user", {
                method: "GET",
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                setUserInfo(data);
            } else {
                console.error("Failed to fetch user info");
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
        }
    };

    return (
        <div>
            {userInfo ? (
                <div>
                    <Navbar imgurl={userInfo.picture} email={userInfo.email} />
                    <Hero name={userInfo.name} uuid={userInfo.uuid} encryption_secret={userInfo.encryption_secret} />
                    <Tasks email={userInfo.email}/>
                    <SetupGuide name={userInfo.name} uuid={userInfo.uuid} encryption_secret={userInfo.encryption_secret} />
                    <FAQ />
                    <Footer />
                </div>
            ) : (<div>
                <p>Session has been expired.</p>
                <p>Please to go back to the
                    <a href={frontendURL}> home page </a>
                    and sign in again</p>
            </div>
            )
            }
        </div >
    );
};
