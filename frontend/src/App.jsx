import {
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Locations from "./pages/Locations";
import LocationDetails from "./pages/LocationDetails";
import Equipment from "./pages/Equipment";
import Warranties from "./pages/Warranties";
import Licenses from "./pages/Licenses";
import Tickets from "./pages/Tickets";
import Technicians from "./pages/Technicians";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import AuditTrail from "./pages/AuditTrail";
import Roles from "./pages/Roles";
import Users from "./pages/Users";
import MyAccount from "./pages/MyAccount";
import Settings from "./pages/Settings";
import HelpDocumentation from "./pages/HelpDocumentation";

import ProtectedRoute from "./pages/ProtectedRoute";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";

import AppLayout from "./components/AppLayout";
import SuccessToast from "./components/SuccessToast";


function App() {
  return (
    <>
      <SuccessToast />
      <Routes>

      {/* PUBLIC */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      <Route
        path="/access-denied"
        element={<AccessDenied />}
      />


      {/* DASHBOARD */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute module="dashboard">
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* MY ACCOUNT */}

      <Route
        path="/my-account"
        element={
          <ProtectedRoute module="dashboard">
            <AppLayout>
              <MyAccount />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* CUSTOMERS */}

      <Route
        path="/customers"
        element={
          <ProtectedRoute module="customers">
            <AppLayout>
              <Customers />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers/:customerId"
        element={
          <ProtectedRoute module="customers">
            <AppLayout>
              <CustomerDetails />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* LOCATIONS */}

      <Route
        path="/locations"
        element={
          <ProtectedRoute module="locations">
            <AppLayout>
              <Locations />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/locations/:locationId"
        element={
          <ProtectedRoute module="locations">
            <AppLayout>
              <LocationDetails />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* EQUIPMENT */}

      <Route
        path="/equipment"
        element={
          <ProtectedRoute module="equipment">
            <AppLayout>
              <Equipment />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* WARRANTIES */}

      <Route
        path="/warranties"
        element={
          <ProtectedRoute module="warranties">
            <AppLayout>
              <Warranties />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* LICENSES */}

      <Route
        path="/licenses"
        element={
          <ProtectedRoute module="licenses">
            <AppLayout>
              <Licenses />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* TICKETS */}

      <Route
        path="/tickets"
        element={
          <ProtectedRoute module="tickets">
            <AppLayout>
              <Tickets />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* TECHNICIANS */}

      <Route
        path="/technicians"
        element={
          <ProtectedRoute module="technicians">
            <AppLayout>
              <Technicians />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* BILLING */}

      <Route
        path="/billing"
        element={
          <ProtectedRoute module="billing">
            <AppLayout>
              <Billing />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* REPORTS */}

      <Route
        path="/reports"
        element={
          <ProtectedRoute module="reports">
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* AUDIT TRAIL */}

      <Route
        path="/audit-trail"
        element={
          <ProtectedRoute module="audit_trail">
            <AppLayout>
              <AuditTrail />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* ROLES */}

      <Route
        path="/roles"
        element={
          <ProtectedRoute module="roles">
            <AppLayout>
              <Roles />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* USERS */}

      <Route
        path="/users"
        element={
          <ProtectedRoute module="users">
            <AppLayout>
              <Users />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* SETTINGS */}

      <Route
        path="/settings"
        element={
          <ProtectedRoute module="settings">
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* HELP & DOCUMENTATION */}

      <Route
        path="/help"
        element={
          <ProtectedRoute module="dashboard">
            <AppLayout>
              <HelpDocumentation />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* 404 */}

      <Route
        path="*"
        element={<NotFound />}
      />

      </Routes>
    </>
  );
}


export default App;