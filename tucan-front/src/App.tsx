// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Homepage from "./pages/homepage";
import Profile from "./pages/profile";
import Index from "./pages/index";
import MyCourses from "./pages/my-courses";
import EditCourse from "./pages/edit-course";
import ExploreCourses from "./pages/explore-courses";

const App = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/homepage" element={<Homepage />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/my-courses" element={<MyCourses />} />
    <Route path="/explore-courses" element={<ExploreCourses />} />
    <Route path="/courses/:courseId/edit" element={<EditCourse />} />
  </Routes>
);

export default App;