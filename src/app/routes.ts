import { createBrowserRouter } from "react-router";
import Login from "./screens/Login";
import Register from "./screens/Register";
import ProfileSetup from "./screens/ProfileSetup";
import Dashboard from "./screens/Dashboard";
import Simulation from "./screens/Simulation";
import Expenses from "./screens/Expenses";
import AIAssistant from "./screens/AIAssistant";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/setup",
    Component: ProfileSetup,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/simulation",
    Component: Simulation,
  },
  {
    path: "/expenses",
    Component: Expenses,
  },
  {
    path: "/ai-assistant",
    Component: AIAssistant,
  },
]);
