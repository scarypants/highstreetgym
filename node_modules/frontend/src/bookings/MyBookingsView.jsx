import { useCallback, useState, useEffect } from "react"
import { TiDelete } from "react-icons/ti";
import { fetchAPI } from "../api.mjs"
import { useAuthenticate } from "../authentication/useAuthenticate"
import XMLDownloadButton from "../common/XMLDownloadButton"

function MyBookingsView() {
    const { user } = useAuthenticate()
    
    const [bookings, setBookings] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const getBookings = useCallback(() => {
        setLoading(true)
        if (!user) return

        setBookings([])
        setError(null)

        fetchAPI("GET", "/bookings", null, user.authenticationKey)
            .then(response => {
                if (response.status == 200) {
                    if (response.body.length > 0) {
                        setBookings(response.body)
                        setError(null)
                        setLoading(false)
                    } else {
                        setBookings([])
                        setError("No bookings found")
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
    }, [setBookings, setError])

    useEffect(() => {
        getBookings()
    }, [getBookings])

    const deleteBooking = useCallback((bookingId, memberId) => {
        setLoading(true)
        fetchAPI("DELETE", "/bookings", { bookingId: bookingId, memberId: memberId }, user.authenticationKey)
            .then(response => {
                if (response.status == 200) {
                    getBookings()
                    setLoading(false)
                } else {
                    setError("Failed to delete booking - " + response.body.message)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("Failed to delete booking - " + error)
                setLoading(false)
            })
    }, [user, getBookings])

    return <section className="max-w-[430px] w-full bg-white shadow-lg rounded-lg p-6 flex flex-col gap-6 items-center">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        {(!loading && !error) ?
            <ul className="flex flex-col gap-4 w-full overflow-y-auto max-h-100 min-h-100">
                { bookings.map(booking => 
                    <li key={booking.booking.id} className="list-row">
                        <div className="card-body">
                            <div className="flex items-center justify-between w-full">
                                <p className="font-medium">{booking.session.date} {booking.session.time}</p>
                                <button
                                    className="btn btn-error btn-sm"
                                    onClick={() => deleteBooking(booking.booking.id, booking.booking.memberId)}>
                                    <TiDelete className="text-2xl" />
                                </button>
                            </div>
                            <h2 className="card-title">{booking.activity.name}</h2>
                            <p className="text-sm text-gray-500">{booking.user.firstName} {booking.user.lastName}</p>
                            <p className="mt-2">{booking.location.name}</p>                        
                        </div>
                    </li>
                )}
            </ul>
            :
            <div className="flex flex-col gap-4 w-full overflow-y-auto min-h-100 items-center">
                {error && <span className="text-error text-center text-sm">{error}</span>}
                {loading && <span className="loading loading-spinner loading-md mt-8"></span>}
            </div>
        }
        <XMLDownloadButton
            route="/bookings/xml"
            filename="bookings.xml"
            disabled={bookings.length === 0} 
            authenticationKey={user && user.authenticationKey}
            className={`btn btn-warning w-full ${bookings.length === 0 ? "btn-disabled" : ""}`}>
                Download Bookings
        </XMLDownloadButton>
    </section>
}

export default MyBookingsView