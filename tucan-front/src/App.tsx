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
import NotificationsPage from "./pages/notifications";
import CreateQuiz from "./pages/create-quiz";
import CourseQuizzes from "./pages/course-quizzes";
import CourseStudents from "./pages/course-students";
import ViewCourse from "./pages/view-course";
import TakeQuiz from "./pages/take-quiz";
import QuizSubmissions from "./pages/quiz-submissions";

const App = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/homepage" element={<Homepage />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/my-courses" element={<MyCourses />} />
    <Route path="/explore-courses" element={<ExploreCourses />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/courses/:courseId/edit" element={<EditCourse />} />
    <Route path="/courses/:courseId/view" element={<ViewCourse />} />
    <Route path="/courses/:courseId/create-quiz" element={<CreateQuiz />} />
    <Route path="/courses/:courseId/quizzes" element={<CourseQuizzes />} />
    <Route path="/courses/:courseId/students" element={<CourseStudents />} />
    <Route path="/quiz/:quizId/take" element={<TakeQuiz />} />
    <Route path="/quiz/:quizId/submissions" element={<QuizSubmissions />} />
  </Routes>
);

export default App;