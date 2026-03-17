import { useState, useEffect, useCallback, Fragment } from "react"
import { useLocation, useNavigate } from "react-router"
import { fetchAPI } from "../api.mjs"
import { useAuthenticate } from "../authentication/useAuthenticate"

function CreateBookingView() {
    const { user } = useAuthenticate()
    const { state } = useLocation()
    const navigate = useNavigate()

    if (!state) {
        return <p>No booking data.</p>
    }

    const { activityName, sessions } = state
    const date = sessions[0]?.session.date || ""

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [userBookings, setUserBookings] = useState([])

    const getBookings = useCallback(() => {
        setLoading(true)
        if (!user) return

        fetchAPI("GET", "/bookings", null, user.authenticationKey)
            .then(response => {
                if (response.status == 200) {
                    if (response.body.length > 0) {
                        setUserBookings(response.body)
                        setLoading(false)
                    } else {
                        setUserBookings([])
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
    }, [user, setUserBookings])

    useEffect(() => {
        getBookings()
    }, [getBookings])

    const bookedSessionIds = userBookings.map(booking => booking.session.id)

    const availableSessions = sessions.filter(
        session => !bookedSessionIds.includes(session.session.id)
    )

    const times = Array.from(new Set(availableSessions.map(session => session.session.time)))
    const trainers = Array.from(new Set(availableSessions.map(session => `${session.user.firstName} ${session.user.lastName}`)))
    const locations = Array.from(new Set(availableSessions.map(session => session.location.name)))

    const [selectedTime, setSelectedTime] = useState("")
    const [selectedTrainer, setSelectedTrainer] = useState("")
    const [selectedLocation, setSelectedLocation] = useState("")

    const submitBooking = useCallback(() => {
        setLoading(true)
        setError("")

        const matchedSession = availableSessions.find(session =>
            session.session.time === selectedTime 
            &&`${session.user.firstName} ${session.user.lastName}` === selectedTrainer 
            && session.location.name === selectedLocation
        )
        if (!matchedSession) {
            setError("No matching session found.")
            setLoading(false)
            return
        }

        fetchAPI("POST", "/bookings", { memberId: user.id, sessionId: matchedSession.session.id }, user.authenticationKey)
            .then(response => {
            if (response.status === 200) {
                setLoading(false)
                navigate("/bookings/member")
            } else {
                setError(response.body.message)
                setLoading(false)
            }
            })
            .catch(error => {
                setError(String(error))
                setLoading(false)
            })
    })

    return (
        <main className="min-h-screen flex items-center justify-center bg-base-100">
            <section className="max-w-[430px] w-full bg-white shadow-lg rounded-lg p-6 flex flex-col gap-6 items-center">
                <h1 className="text-3xl font-bold">Create Booking</h1>
                {(error || loading) ?
                    <div className="flex flex-col gap-4 w-full overflow-y-auto min-h-100 items-center">
                        {error && <span className="text-error text-center text-sm">{error}</span>}
                        {loading && <span className="loading loading-spinner loading-md mt-8"></span>}
                    </div>
                    :
                    <Fragment>
                        <p className="text-lg">{activityName}</p>
                        <p className="text-sm opacity-70">{date}</p>

                        <div className="flex flex-col w-full gap-1">
                            <label className="font-medium">Time</label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedTime}
                                onChange={e => setSelectedTime(e.target.value)}
                            >
                                <option value="" disabled hidden>Select Time</option>
                                {times.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col w-full gap-1">
                            <label className="font-medium">Trainer</label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedTrainer}
                                onChange={e => setSelectedTrainer(e.target.value)}
                            >
                                <option value="" disabled hidden>Select Trainer</option>
                                {trainers.map(trainer => <option key={trainer} value={trainer}>{trainer}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col w-full gap-1">
                            <label className="font-medium">Location</label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedLocation}
                                onChange={e => setSelectedLocation(e.target.value)}
                            >
                                <option value="" disabled hidden>Select Location</option>
                                {locations.map(location => <option key={location} value={location}>{location}</option>)}
                            </select>
                        </div>
                    </Fragment>
                }
                <div className="flex gap-4 w-full">
                    <button
                        onClick={() => navigate("/sessions")}
                        disabled={loading}
                        className="btn flex-1"
                    >
                        Back
                    </button>
                    <button
                        className="btn btn-primary flex-1"
                        onClick={submitBooking}
                        disabled={loading}
                    >
                        {loading ? "Booking..." : "Book"}
                    </button>
                </div>
            </section>
        </main>
    )
}

export default CreateBookingView
