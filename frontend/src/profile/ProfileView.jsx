import { useCallback, useState, useEffect, Fragment } from "react"
import { useAuthenticate } from "../authentication/useAuthenticate"
import validator from "validator"
import { useNavigate } from "react-router"
import { fetchAPI } from "../api.mjs"

function ProfileView() {
    const navigate = useNavigate()

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const { user, logout } = useAuthenticate()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName)
            setLastName(user.lastName)
            setEmail(user.email)
            setPassword(user.password)
            setLoading(false)
        } else {
            setLoading(true)
        }
    }, [user])

    const [validationErrors, setValidationErrors] = useState({})

    const updateUser = useCallback(() => {
        setLoading(true)

        const validationErrors = {}
        if (!firstName || !/^(?=.*[a-zA-Z-'])[a-zA-Z-'\s]+$/.test(firstName)) {
            validationErrors["firstName"] = "Please enter valid first name."
        }
        if (!lastName || !/^(?=.*[a-zA-Z-'])[a-zA-Z-'\s]+$/.test(lastName)) {
            validationErrors["lastName"] = "Please enter valid last name."
        }
        if (!validator.isEmail(email)) {
            validationErrors["email"] = "Please enter valid email."
        }
        if (!password) {
            validationErrors["password"] = "Please enter password."
        }
        setValidationErrors(validationErrors)

        if (Object.keys(validationErrors).length > 0) {
            setLoading(false)
            return
        }

        fetchAPI("PATCH", "/users", {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            authenticationKey: user.authenticationKey
        }, user.authenticationKey)
            .then(response => {
                if (response.status == 200) {
                    navigate("/profile")
                    setLoading(false)
                } else {
                    setError("Failed to update user - " + response.body.message)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("Failed to update user - " + error)
                setLoading(false)
            })
    }, [firstName, lastName, email, password, user, setLoading, setValidationErrors, setError])

    const onLogoutClick = useCallback(() => {
        logout()
        navigate("/")
    }, [logout, navigate])

    if (!user) {
        return <span className="loading loading-spinner loading-md"></span>
    }

    return <section className="overflow-y-auto max-w-[430px] w-full bg-white shadow-lg rounded-lg p-6 flex flex-col gap-6 items-center">
        {loading && <span className="loading loading-spinner loading-md"></span>}
        {error && <p className="text-error text-xs">{error}</p>}
        <h1 className="text-3xl font-bold">Profile</h1>
        {(error || loading) ?
            <div className="flex flex-col gap-4 w-full overflow-y-auto min-h-100 items-center">
                {error && <span className="text-error text-center text-sm">{error}</span>}
                {loading && <span className="loading loading-spinner loading-md mt-8"></span>}
            </div>
            :
            <Fragment>
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium">Role</label>
                    <input value={user.role} disabled className="input input-bordered w-full bg-gray-100" />
                </div>
                <div className="flex gap-4 w-full">
                    <div className="flex flex-col flex-1 gap-1">
                        <label className="font-medium">First Name</label>
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            disabled={loading}
                            className="input input-bordered w-full"
                        />
                        {validationErrors.firstName && <p className="text-error text-sm">{validationErrors.firstName}</p>}
                    </div>
                    <div className="flex flex-col flex-1 gap-1">
                        <label className="font-medium">Last Name</label>
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            disabled={loading}
                            className="input input-bordered w-full"
                        />
                        {validationErrors.lastName && <p className="text-error text-sm">{validationErrors.lastName}</p>}
                    </div>
                </div>
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium">Email</label>
                    <input type="text" placeholder="Email" className="input input-bordered w-full" value={email} onChange={e => setEmail(e.target.value)} />
                    {validationErrors.email && <div className="text-error text-sm">{validationErrors.email}</div>}
                </div>
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium">Password</label>
                    <input type="password" placeholder="Password" className="input input-bordered w-full" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                
                <div className="flex gap-4 w-full">
                    <button
                        onClick={() => navigate("/")}
                        className="btn flex-1"
                        disabled={loading}
                    >
                        Back
                    </button>
                    <button
                        onClick={() => updateUser()}
                        className="btn btn-primary flex-1"
                        disabled={loading}
                    >
                        Save
                    </button>
                </div>
                <button className="btn btn-error w-full" onClick={() => onLogoutClick()}>Logout</button>
            </Fragment>
        }
    </section>
}

export default ProfileView