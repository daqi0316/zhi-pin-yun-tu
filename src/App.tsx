import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import TalentPool from "./pages/TalentPool";
import Channels from "./pages/Channels";
import InterviewFlow from "./pages/InterviewFlow";
import TalentProfiles from "./pages/TalentProfiles";
import OfferManage from "./pages/OfferManage";
import Analytics from "./pages/Analytics";
import AlertCenter from "./pages/AlertCenter";
import CompanyRelations from "./pages/CompanyRelations";
import Positions from "./pages/Positions";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

function AppLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AppLayout>
            <Home />
          </AppLayout>
        }
      />
      <Route
        path="/talent"
        element={
          <AppLayout>
            <TalentPool />
          </AppLayout>
        }
      />
      <Route
        path="/channels"
        element={
          <AppLayout>
            <Channels />
          </AppLayout>
        }
      />
      <Route
        path="/interviews"
        element={
          <AppLayout>
            <InterviewFlow />
          </AppLayout>
        }
      />
      <Route
        path="/profiles"
        element={
          <AppLayout>
            <TalentProfiles />
          </AppLayout>
        }
      />
      <Route
        path="/offers"
        element={
          <AppLayout>
            <OfferManage />
          </AppLayout>
        }
      />
      <Route
        path="/analytics"
        element={
          <AppLayout>
            <Analytics />
          </AppLayout>
        }
      />
      <Route
        path="/alerts"
        element={
          <AppLayout>
            <AlertCenter />
          </AppLayout>
        }
      />
      <Route
        path="/relations"
        element={
          <AppLayout>
            <CompanyRelations />
          </AppLayout>
        }
      />
      <Route
        path="/positions"
        element={
          <AppLayout>
            <Positions />
          </AppLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
