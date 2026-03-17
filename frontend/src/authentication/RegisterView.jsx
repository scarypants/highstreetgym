import { useCallback, useState, Fragment } from "react"
import { useNavigate } from "react-router"
import { fetchAPI } from "../api.mjs"
import validator from "validator"

function RegisterView() {
    const navigate = useNavigate()

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [validationErrors, setValidationErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const submitUser = useCallback(() => {
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
            validationErrors["password"] = "Please enter a password."
        }
        setValidationErrors(validationErrors)

        if (Object.keys(validationErrors).length > 0) {
            setLoading(false)
            return
        }

        fetchAPI("POST", "/users", {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password
        })
            .then(response => {
                if (response.status == 200) {
                    setLoading(false)
                    navigate("/login")
                } else {
                    setError("Failed to create user - " + response.body.message)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("Failed to create user - " + error)
                setLoading(false)
            })
    }, [firstName, lastName, email, password, setLoading, setValidationErrors, navigate, setError])

    return (
        <main className="min-h-screen flex items-center justify-center bg-base-100">
            <section className="max-w-[430px] w-full bg-white shadow-lg rounded-lg p-6 flex flex-col gap-6 items-center">
                <img src="/img/logo.png" alt="Logo" className="w-40 mb-4" />
                <h1 className="text-3xl font-bold">Register</h1>
                {loading && <span className="loading loading-spinner loading-md"></span>}
                {!loading && !error &&
                    <Fragment>
                        <div className="flex flex-col w-full gap-1">
                            <label className="input w-full">
                                <span className="label">First Name</span>
                                <input
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className="grow" type="text" />
                            </label>
                            {validationErrors.firstName && <p className="text-error self-start text-sm">{validationErrors.firstName}</p>}
                        </div>
                        <div className="flex flex-col w-full gap-1">
                            <label className="input w-full">
                                <span className="label">Last Name</span>
                                <input
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className="grow" type="text" />
                            </label>
                            {validationErrors.lastName && <p className="text-error self-start text-sm">{validationErrors.lastName}</p>}
                        </div>
                        <div className="flex flex-col w-full gap-1">
                            <label className="input w-full">
                                <span className="label">Email</span>
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="grow" type="text" />
                            </label>
                            {validationErrors.email && <p className="text-error self-start text-sm">{validationErrors.email}</p>}
                        </div>
                        <div className="flex flex-col w-full gap-1">
                            <label className="input w-full">
                                <span className="label">Password</span>
                                <input
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="grow" type="password" />
                            </label>
                            {validationErrors.password && <p className="text-error self-start text-sm">{validationErrors.password}</p>}
                        </div>
                        <div className="flex gap-4 w-full mt-2">
                            <button onClick={() => navigate("/")} disabled={loading} className="btn w-full flex-1">
                                Back
                            </button>
                            <button onClick={() => submitUser()} disabled={loading} className="btn btn-primary w-full flex-1">
                                {loading
                                    ? <span className="loading loading-spinner loading-sm"></span>
                                    : "Sign Up"
                                }
                            </button>
                        </div>
                        <p className="opacity-60 text-sm">By signing in, you agree to acknowledge the <a href="https://www.legislation.gov.au/C2004A03712/2019-08-13/text">Privacy Policy</a>.</p>
                        {error && <p className="text-error mt-2">{error}</p>}
                    </Fragment>
                }
            </section>
        </main>
    )
}

export default RegisterView