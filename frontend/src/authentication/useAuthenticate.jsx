import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { fetchAPI } from "../api.mjs"
import { useNavigate } from "react-router"

export const AuthenticationContext = createContext(null)

export function AuthenticationProvider({ children }) {
    const [user, setUser] = useState(null)
    const [status, setStatus] = useState("resuming")
    
    // Resume user state from auth key in local storage on page reload
    useEffect(() => {
        const authenticationKey = localStorage.getItem("auth-key")

        if (authenticationKey) {
            fetchAPI("GET", "/users", null, authenticationKey)
                .then(response => {
                    if (response.status == 200) {
                        setUser(response.body)
                        setStatus("loaded")
                    } else {
                        setStatus(response.body.message)
                    }
                })
                .catch(error => {
                    setStatus(error)
                })
        } else {
            setStatus("logged out")
        }
    }, [setUser, setStatus])

    return <AuthenticationContext.Provider value={[user, setUser, status, setStatus]}>
        {children}
    </AuthenticationContext.Provider>
}

export function useAuthenticate(restrictToRoles = null) {
    const [user, setUser, status, setStatus] = useContext(AuthenticationContext)
    
    // Function that takes an authentication key of the currently
    // logged in users and loads their user data from the server using the
    // GET /self endpoint.
    const getUser = useCallback((authenticationKey) => {
        if (authenticationKey) {
            setStatus("loading")
            fetchAPI("GET", "/users", null, authenticationKey)
                .then(response => {
                    if (response.status == 200) {
                        setUser(response.body)
                        setStatus("loaded")
                    } else {
                        setStatus(response.body.message)
                    }
                })
                .catch(error => {
                    setStatus(error)
                })
        }
    }, [setUser, setStatus])

    // Function  that takes a email and password
    // and fetches (POST) /api/auth and then stores the key
    // and loads the user.
    const login = useCallback((email, password) => {
        const body = {
            email,
            password
        }
        
        setStatus("authenticating")
        fetchAPI("POST", "/auth", body)
            .then(response => {
                if (response.status == 200) {
                    localStorage.setItem("auth-key", response.body.key)
                    console.log(response.body.key)
                    // Load the user by their key
                    getUser(response.body.key)
                    setStatus("loaded")
                } else {
                    setStatus(response.body.message)
                }
            })
            .catch(error => {
                setStatus(error)
            })
    }, [setStatus, getUser])
    
    // Logout the user by telling the server to clear our key,
    // clearing the user state, and removing the key from localstorage.
    const logout = useCallback(() => {
        fetchAPI("DELETE", "/auth", null, user.authenticationKey)
            .then(response => {
                setUser(null)
                localStorage.removeItem("auth-key")
                setStatus("logged out")
            })
            .catch(error => {
                setStatus(error)
            })
    }, [user, setUser, setStatus])
    
    // Refresh the user data from the backend by simply re-requesting
    // the same user with their existing key. 
    const refresh = useCallback(() => {
        getUser(user.authenticationKey)
    }, [user, getUser])

    const navigate = useNavigate()

    useEffect(() => {
        if (restrictToRoles && status != "resuming" && (!user || !restrictToRoles.includes(user.role))) {
            navigate("/")
        }
    }, [user, status, restrictToRoles, navigate])
    
    return {
        user,
        login,
        logout,
        refresh,
        status
    }
}