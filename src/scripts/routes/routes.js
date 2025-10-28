// ISI FILE: src/scripts/routes/routes.js (LENGKAP)

import HomePage from "../pages/home/home-page";
import AddStory from "../pages/story/add-story";
import LoginPage from "../pages/auth/login/login-page";
import RegisterPage from "../pages/auth/register/register-page";
import NotificationPage from "../pages/notification/notification-page";
import BookmarkPage from "../pages/bookmark/bookmark-page";
import AboutPage from "../pages/about/about-page"; 

import {
  checkAuthenticatedRoute,
  checkUnauthenticatedRouteOnly,
} from "../utils/auth";

const routes = {
  "/": checkAuthenticatedRoute(new HomePage()),
  "/add-story": checkAuthenticatedRoute(new AddStory()),
  "/login": checkUnauthenticatedRouteOnly(new LoginPage()),
  "/register": checkUnauthenticatedRouteOnly(new RegisterPage()),
  "/notifikasi": checkAuthenticatedRoute(new NotificationPage()),
  "/bookmark": checkAuthenticatedRoute(new BookmarkPage()),
  "/about": checkAuthenticatedRoute(new AboutPage()), 
};

export default routes;