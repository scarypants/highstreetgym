import { Fragment, useCallback, useEffect, useState } from "react"
import { fetchAPI } from "../api.mjs"
import { useAuthenticate } from "../authentication/useAuthenticate"
import XMLDownloadButton from "../common/XMLDownloadButton"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function partitionByDay(sessions) {
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
        const [yyyy, mm, dd] = session.session.date.split("/")
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
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return [year, month, day].join('-')
}

function WeeklySessionsView() {
    const { user } = useAuthenticate()
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

        fetchAPI("GET", `/sessions/trainer?start_date=${startDate}&end_date=${endDate}`, null, user.authenticationKey)
            .then(response => {
                if (response.status == 200) {
                    if (response.body.length > 0) {
                        setSessionsByDay(partitionByDay(response.body))
                        setError(null)
                        setLoading(false)
                    } else {
                        setSessionsByDay({})
                        setError("No sessions found")
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
    
    const hasSessions = Object.values(sessionsByDay).some(daySessions => daySessions.length > 0)

    return (
        <section className="max-w-[430px] w-full bg-white shadow-lg rounded-lg p-6 flex flex-col gap-6 items-center">
            {loading && <span className="loading loading-spinner loading-md"></span>}
            {error && <span>{error}</span>}
            <h1 className="text-3xl font-bold">Weekly Sessions</h1>
            {!loading && !error && (
                <ul className="flex flex-col gap-4 w-full overflow-y-auto max-h-100">
                {daysOfWeek.map(day => {
                    const sessions = sessionsByDay[day] || []
                    return (
                        <Fragment key={day}>
                            <li className="w-full px-4 py-2 text-xs font-medium opacity-60 border-t border-gray-300">
                                {day}
                            </li>
                            {sessions.map(session => (
                            <li key={session.session.id} className="card card-compact bg-base-100 shadow w-full">
                                <div className="card-body flex flex-row items-center justify-between p-4">
                                    <span className="font-semibold">{session.activity.name}</span>
                                    <div className="flex flex-col items-end">
                                        <div className="text-sm text-gray-500">{session.session.time}</div>
                                        <div className="text-sm text-gray-500">{session.location.name}</div>
                                    </div>
                                </div>
                            </li>
                            ))}
                        </Fragment>
                    )
                })}
                </ul>
            )}
            <XMLDownloadButton
                route="/sessions/xml"
                filename="sessions.xml"
                disabled={!hasSessions}
                authenticationKey={user && user.authenticationKey}
                className={`btn btn-warning w-full ${!hasSessions ? "btn-disabled" : ""}`}>
                    Download Sessions
            </XMLDownloadButton>
        </section>
    )
}

export default WeeklySessionsView