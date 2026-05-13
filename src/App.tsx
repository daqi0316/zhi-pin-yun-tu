import { Routes, Route, Navigate } from "react-router";
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
import AuditLog from "./pages/AuditLog";
import UserManage from "./pages/UserManage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { trpc } from "./providers/trpc";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = trpc.auth.me.useQuery();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }
  if (!me) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

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
          <RequireAuth>
            <AppLayout>
              <Home />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/talent"
        element={
          <RequireAuth>
            <AppLayout>
              <TalentPool />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/channels"
        element={
          <RequireAuth>
            <AppLayout>
              <Channels />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/interviews"
        element={
          <RequireAuth>
            <AppLayout>
              <InterviewFlow />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/profiles"
        element={
          <RequireAuth>
            <AppLayout>
              <TalentProfiles />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/offers"
        element={
          <RequireAuth>
            <AppLayout>
              <OfferManage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <AppLayout>
              <Analytics />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/alerts"
        element={
          <RequireAuth>
            <AppLayout>
              <AlertCenter />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/relations"
        element={
          <RequireAuth>
            <AppLayout>
              <CompanyRelations />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/positions"
        element={
          <RequireAuth>
            <AppLayout>
              <Positions />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/audit"
        element={
          <RequireAuth>
            <AppLayout>
              <AuditLog />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth>
            <AppLayout>
              <UserManage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
