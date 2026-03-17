import { useNavigate, Outlet, useLocation } from "react-router"
import { FaRegListAlt } from "react-icons/fa";
import { MdCalendarMonth, MdOutlineAccessTime } from "react-icons/md";
import { IoMdPerson } from "react-icons/io";
import { useAuthenticate } from "../authentication/useAuthenticate";

function DockButton({ disabled, to, icon, label }) {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <button
            disabled={disabled}
            onClick={() => navigate(to)}
            className={location.pathname.startsWith(to) ? "dock-active" : ""}>
            {icon}
            <span className="dock-label">{label}</span>
        </button>
    )
}

function Layout() {
    const navigate = useNavigate()
    const { user } = useAuthenticate()

    const memberMenu = [
        { disabled: false, to: "/bookings/member", icon: <FaRegListAlt />, label: "My Bookings" },
        { disabled: false, to: "/sessions", icon: <MdCalendarMonth />, label: "Weekly Timetable" }
    ]

    const trainerMenu = [
        { disabled: true, to: "/sessions/management", icon: <MdOutlineAccessTime />, label: "Manage Sessions" },
        { disabled: false, to: "/sessions/trainer", icon: <MdCalendarMonth />, label: "Weekly Sessions" }
    ]

    const adminMenu = [
        { disabled: true, to: "/management", icon: <FaRegListAlt />, label: "Management" }
    ]

    const profileMenu = [
        { disabled: false, to: "/profile", icon: <IoMdPerson />, label: "Profile" }
    ]

    const roleMenuMap = {
        member: memberMenu,
        trainer: trainerMenu,
        admin: adminMenu
    }

    const currentMenu = user ? [...(roleMenuMap[user.role] || []), ...profileMenu] : []

    return (
        <main className="max-w-[430px] min-h-screen mx-auto shadow">
            <header className="flex flex-col gap-4 p-4 items-center">
                <button onClick={() => navigate("/")} className="btn btn-ghost">
                    <img src="/img/logo.png" alt="Logo" className="w-8" />
                    <h1>High Street Gym</h1>
                </button>
            </header>
            <Outlet />
            <nav className="dock max-w-[430px] mx-auto">
                {currentMenu.map((item, idx) => (
                    <DockButton key={idx} disabled={item.disabled} to={item.to} icon={item.icon} label={item.label} />
                ))}
            </nav>
        </main>
    )
}

export default Layout