// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Homepage from "./pages/homepage";
import Profile from "./pages/profile";
import Index from "./pages/index";

const App = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/homepage" element={<Homepage />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
);

export default App;