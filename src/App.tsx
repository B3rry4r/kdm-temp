import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./pages/Layout/Layout";
import HomePage from "./pages/HomePage/HomePage";
import SavedPosts from "./pages/SavedPosts/SavedPosts";
// import MessagesPage from "./pages/MessagesPage/MessagesPage";
import TopicsPage from "./pages/Topics/TopicsPage";
import InstitutionsPage from "./pages/InstititionsPage/InstititionsPage";
import CoursesPage from "./pages/CoursesPage/CoursesPage";
import SingleCourse from "./pages/CoursesPage/SingleCousre/SingleCourse";
import MyCoursesPage from "./pages/MyCoursesPage/MyCoursesPage";
import MySingleCourse from "./pages/MyCoursesPage/SingleCousre/MySingleCourse";
import EventsPage from "./pages/EventsPage/EventsPage";
import SingleEventPage from "./pages/EventsPage/SingleEventPage/SingleEventPage";
import { AuthProvider } from "./context/AuthContext/AuthContext";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import Registration from "./pages/Registration/Registration";
import CommentPage from "./pages/CommentPage/CommentPage";
import OtherUsersProfilePage from "./pages/ProfilePage/OtherUsersProfilePage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import Settings from "./pages/Settings/Settings";
import ReferPage from "./pages/ReferPage/ReferPage";
import StartedCoursePage from "./pages/MyCoursesPage/StartedCoursePages/StartedCoursePage";
import QuizPage from "./pages/QuizPage/QuizPage";
import QuizResultsPage from "./pages/QuizPage/Components/QuizResultsPage";
import About from "./pages/About/About";
// import SingleMessage from "./pages/MessagesPage/SingleMessage";
import { DataProvider } from "./context/DataContext/DataContext";
import { PostUpdateProvider } from "./context/PostUpdateContext/PostUpdateContext";

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <DataProvider>
        <PostUpdateProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />
            <Route path="/login" element={<Registration />} />

            {/* Protected Routes */}
            <Route
              path="/saved-posts"
              element={
                <PrivateRoute>
                  <Layout>
                    <SavedPosts />
                  </Layout>
                </PrivateRoute>
              }
            />
            {/* <Route
              path="/messages"
              element={
                <PrivateRoute>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </PrivateRoute>
              }
            /> */}
            {/* <Route
              path="/messages/:message"
              element={
                <PrivateRoute>
                  <SingleMessage />
                </PrivateRoute>
              }
            /> */}
            <Route
              path="/topics/:topicId"
              element={
                <PrivateRoute>
                  <Layout>
                    <TopicsPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/institutions/:orgId"
              element={
                <PrivateRoute>
                  <Layout>
                    <InstitutionsPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/:course"
              element={
                <PrivateRoute>
                  <Layout>
                    <CoursesPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/courses/course/:courseId"
              element={
                <PrivateRoute>
                  <Layout>
                    <SingleCourse />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/my-courses"
              element={
                <PrivateRoute>
                  <Layout>
                    <MyCoursesPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/my-courses/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <MySingleCourse />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <Layout>
                    <EventsPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/events/event/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <SingleEventPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/comments/:postId"
              element={
                <PrivateRoute>
                  <Layout>
                    <CommentPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/profiles/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <OtherUsersProfilePage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/user-profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/refer"
              element={
                <PrivateRoute>
                  <Layout>
                    <ReferPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/started-course/:id"
              element={
                <PrivateRoute>
                  <StartedCoursePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz/:quiz"
              element={
                <PrivateRoute>
                  <QuizPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz-results"
              element={
                <PrivateRoute>
                  <QuizResultsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/about"
              element={
                <PrivateRoute>
                  <About />
                </PrivateRoute>
              }
            />
          </Routes>
        </PostUpdateProvider>
      </DataProvider>
    </AuthProvider>
  </Router>
);

export default App;