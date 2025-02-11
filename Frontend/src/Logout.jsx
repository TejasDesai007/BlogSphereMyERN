import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const logoutUser = async () => {
            try {
                const response = await fetch("http://localhost:8082/api/users/logout", {
                    method: "POST",
                    credentials: "include", // Important for session cookies
                });

                if (response.ok) {
                    // Remove user from local storage
                    sessionStorage.removeItem("user");

                    // Redirect to login page
                    navigate("/login");
                } else {
                    console.error("Logout failed!");
                }
            } catch (error) {
                console.error("Logout error:", error);
            }
        };

        logoutUser();
    }, [navigate]);

    return (
        <></>
    );
};

export default Logout;
