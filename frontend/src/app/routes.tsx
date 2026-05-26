import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Eligibility } from "./pages/Eligibility";
import { Process } from "./pages/Process";
import { Locations } from "./pages/Locations";
import { Rewards } from "./pages/Rewards";
import { Profile } from "./pages/Profile";
import { Records } from "./pages/Records";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "eligibility", Component: Eligibility },
      { path: "process", Component: Process },
      { path: "locations", Component: Locations },
      { path: "rewards", Component: Rewards },
      { path: "profile", Component: Profile },
      { path: "records", Component: Records },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
