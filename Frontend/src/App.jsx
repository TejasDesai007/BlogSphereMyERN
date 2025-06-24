import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min"; // Bootstrap JS
import "@fortawesome/fontawesome-free/css/all.min.css"; // FontAwesome CSS
import Registration from "./Registration";
import Login from "./Login";
import Home from "./Home";
import NotFound from "./PageNotFound";
import Navbar from "./Navbar";
import Logout from "./Logout";
import AddPost from "./posts/AddPost";
import Posts from "./posts/ViewPost";
import Profile from "./profile";
import OtherProfile from "./OtherProfile";
import "./App.css";



function App() {
  return (
    <Router>
      
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/add-post" element={<AddPost />} />
          <Route path="/ViewPost" element={<Posts />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/profile/:userID" element={<OtherProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;