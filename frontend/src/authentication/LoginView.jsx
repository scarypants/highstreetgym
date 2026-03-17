import { Fragment, useCallback, useEffect, useState } from "react"
import { useAuthenticate } from "./useAuthenticate"
import { useNavigate } from "react-router"

function LoginView() {
    const navigate = useNavigate()
    const { login, status, user } = useAuthenticate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    
    const [validationErrors, setValidationErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const onLoginClick = useCallback(() => {
        const validationErrors = {}
        if (!email) {
            validationErrors["email"] = "Please enter your email."
        }
        if (!password) {
            validationErrors["password"] = "Please enter your password."
        }
        setValidationErrors(validationErrors)

        if (Object.keys(validationErrors).length > 0) {
            setLoading(false)
            return
        }

        setLoading(true)

        login(email, password)
    }, [email, password, setLoading, setValidationErrors, login])

    useEffect(() => {
        if (user) {
            navigate("/")
        }
    }, [user, navigate])

    useEffect(() => {
        if (status) {
            setLoading(false)
        }
    }, [status])

    return (
        <main className="max-w-[430px] min-h-screen mx-auto shadow">
            <section className="max-w-[430px] w-full bg-white shadow-lg rounded-lg p-6 flex flex-col gap-6 items-center">
                <img src="/img/logo.png" alt="Logo" className="w-40 mb-4" />
                <h1 className="text-3xl font-bold">Login</h1>
                {loading && <span className="loading loading-spinner loading-md"></span>}
                {!loading && 
                    <Fragment>
                        <div className="flex flex-col w-full gap-1">
                            <label className="input w-full">
                                <span className="label">Email</span>
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={loading}
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
                                    disabled={loading}
                                    className="grow" type="password" />
                            </label>
                            {validationErrors.password && <p className="text-error self-start text-sm">{validationErrors.password}</p>}
                        </div>
                        <button onClick={() => onLoginClick()} className="btn btn-primary w-full" disabled={loading}>
                            {loading
                                ? <span className="loading loading-spinner loading-sm"></span>
                                : "Login"
                            }
                        </button>
                        <div className="flex gap-4 w-full mt-2">
                            <button onClick={() => navigate("/")} className="btn w-full flex-1" disabled={loading}>
                                Back
                            </button> 
                            <button onClick={() => navigate("/register")} className="btn btn-secondary w-full flex-1" disabled={loading}>
                                Sign Up
                            </button>
                        </div>
                    </Fragment>
                }
                {status && <p className="text-error mt-2">{status}</p>}
            </section>
        </main>
    )
}

export default LoginView