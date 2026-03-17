import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { fetchAPI } from "../api.mjs"
import { useAuthenticate } from "../authentication/useAuthenticate"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function partitionByDayAndActivity(sessions) {
    const dayPartitions = {
        "Monday": [],
        "Tuesday": [],
        "Wednesday": [],
        "Thursday": [],
        "Friday": [],
        "Saturday": [],
        "Sunday": [],
    }

    for (const session of sessions) {
        const [dd, mm, yyyy] = session.session.date.split("/")
        const date = new Date(
            parseInt(yyyy,10),
            parseInt(mm,10)-1,
            parseInt(dd,10)
        )

        dayPartitions[daysOfWeek[date.getDay()]].push(session)
    }

    return dayPartitions
}

function toLocaleDateString(date) {
    const year = date.toLocaleString('en-AU', { year: 'numeric' });
    const month = date.toLocaleString('en-AU', { month: '2-digit' })
    const day = date.toLocaleString('en-AU', { day: '2-digit' });

    return [year, month, day].join('-');
}

function WeeklyTimetableView() {
    const { user } = useAuthenticate()
    const navigate = useNavigate()

    const [sessionsByDay, setSessionsByDay] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const getSessions = useCallback(() => {
        if (!user) return
        setLoading(true)
        setError(null)

        const today = new Date()

        const mondayOfThisWeek = new Date(today)
        mondayOfThisWeek.setDate(today.getDate() - (today.getDay() - 1))
        const startDate = toLocaleDateString(mondayOfThisWeek)

        const sundayOfThisWeek = new Date(mondayOfThisWeek)
        sundayOfThisWeek.setDate(mondayOfThisWeek.getDate() + 6)
        const endDate = toLocaleDateString(sundayOfThisWeek)

        fetchAPI("GET", `/sessions?start_date=${startDate}&end_date=${endDate}`, null, user.authenticationKey)
            .then(response => {
                if (response.status == 200) {
                    if (response.body.length > 0) {
                        setSessionsByDay(partitionByDayAndActivity(response.body))
                        setError(null)
                        setLoading(false)
                    } else {
                        setSessionsByDay({})
                        setError("No result")
                        setLoading(false)
                    }
                } else {
                    setError(response.body.message)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError(error)
                setLoading(false)
            })
    }, [user])

    useEffect(() => {
        getSessions()
    }, [getSessions])

    return (
        <section className="max-w-[430px] w-full bg-white shadow-lg rounded-lg p-6 flex flex-col gap-6 items-center">
            <h1 className="text-3xl font-bold">Weekly Timetable</h1>
            {(!loading && !error) ? 
                    (<ul className="flex flex-col gap-4 w-full overflow-y-auto max-h-115 min-h-100">
                        {daysOfWeek.map(day => {
                            const sessions = sessionsByDay[day] || []
                            const activityNames = [
                                ...new Set(sessions.map(session => session.activity.name))
                            ]
                            return (
                                <div key={day}>
                                    <li className="w-full px-4 py-2 text-sm font-medium opacity-60 border-t border-gray-300">{day}</li>
                                    {activityNames.map(activityName => (
                                        <li key={activityName} className="card card-compact bg-base-100 shadow w-full">
                                            <div className="card-body flex flex-row items-center justify-between p-4">
                                                <span className="font-semibold uppercase">
                                                    {activityName}
                                                </span>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() =>
                                                        navigate("/bookings/create", {
                                                            state: {
                                                                day,
                                                                activityName: activityName,
                                                                sessions: sessions.filter(
                                                                    d => d.activity.name === activityName
                                                                )
                                                            }
                                                        })
                                                    }
                                                >Book</button>
                                            </div>
                                        </li>
                                    ))}
                                </div>
                            )
                        })}
                    </ul>
                )
                :
                    <div className="flex flex-col gap-4 w-full overflow-y-auto min-h-100 items-center">
                        {error && <span className="text-error text-center text-sm">{error}</span>}
                        {loading && <span className="loading loading-spinner loading-md mt-8"></span>}
                    </div>
            }
        </section>
        )
}

export default WeeklyTimetableView