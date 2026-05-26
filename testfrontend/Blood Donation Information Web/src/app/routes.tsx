import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Eligibility } from "./pages/Eligibility";
import { Process } from "./pages/Process";
import { Locations } from "./pages/Locations";
import { Rewards } from "./pages/Rewards";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "eligibility", Component: Eligibility },
      { path: "process", Component: Process },
      { path: "locations", Component: Locations },
      { path: "rewards", Component: Rewards },
      { path: "profile", Component: Profile },
    ],
  },
]);
