import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AuthenticationProvider } from './authentication/useAuthenticate'
import Layout from './common/Layout'
import MicroblogView from './microblog/MicroblogView'
import LoginView from './authentication/LoginView'
import ProfileView from './profile/ProfileView'
import RegisterView from './authentication/RegisterView'
import MyBookingsView from './bookings/MyBookingsView'
import WeeklyTimetableView from './sessions/WeeklyTimetableView'
import WeeklySessionsView from './sessions/WeeklySessionsView'
import CreateBookingView from './bookings/CreateBookingView'

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: MicroblogView,
      },
      {
        path: "/profile",
        Component: ProfileView,
      },
      {
        path: "/bookings/member",
        Component: MyBookingsView,
      },
      {
        path: "/sessions",
        Component: WeeklyTimetableView,
      },
      {
        path: "/sessions/trainer",
        Component: WeeklySessionsView,
      },
    ]
  },
  {
    path: "/login",
    Component: LoginView,
  },
  {
    path: "/register",
    Component: RegisterView,
  },
  {
    path: "/bookings/create",
    Component: CreateBookingView,
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthenticationProvider>
      <RouterProvider router={router} />
    </AuthenticationProvider>
  </StrictMode>,
)
