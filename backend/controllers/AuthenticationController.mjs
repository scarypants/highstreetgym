import express from "express"
import session from "express-session"
import bcrypt from "bcryptjs"
import validator from "validator"
import { UserModel } from "../models/UserModel.mjs"

/**
 * Authentication controller.
 *
 * This controller handles user authentication tasks such as login,
 * registration, and logout. It sets up middleware for session management,
 * and defines routes for displaying login/register pages and processing
 * authentication actions. It uses bcrypt for password comparison and
 * validator for input validation.
 */
export class AuthenticationController {
    static middleware = express.Router()
    static routes = express.Router()

    /**
     * Initialize middleware and routes.
     *
     * This static block sets up session management middleware,
     * custom session authentication, and route handlers for
     * registration, login, and logout.
     */
    static {
        // Set up session middleware with configuration options.
        this.middleware.use(session({
            secret: "d38372e8-2655-49ce-87e9-35ab2b35a0e0",
            resave: false,
            saveUninitialized: false,
            cookie: { secure: "auto" }
        }))

        // Add custom session auth middleware.
        this.middleware.use(this.#session_authentication)

        // Define route to display registration page.
        this.routes.get("/register", this.viewRegister)
        // Define route to display login page.
        this.routes.get("/", this.viewLogin)

        // Define route to logout via GET for users with allowed roles.
        this.routes.get("/logout", AuthenticationController.restrict(["admin", "trainer", "member"]), this.handleDeauthenticate)
        // Define route to process login via POST.
        this.routes.post("/", this.handleAuthenticate)
        // Define route to logout via DELETE for users with allowed roles.
        this.routes.delete("/", AuthenticationController.restrict(["admin", "trainer", "member"]), this.handleDeauthenticate)
    }

    /**
     * Session authentication middleware.
     *
     * This private asynchronous method checks if the current session contains a user ID.
     * If a user ID exists and no authenticated user is attached to the request,
     * it retrieves the user from the database using UserModel.getById and attaches the
     * user object to req.authenticatedUser.
     *
     * @param {express.Request} req - The HTTP request object, which may include session data.
     * @param {express.Response} res - The HTTP response object.
     * @param {Function} next - Callback to pass control to the next middleware.
     * @returns {Promise<void>} A promise that resolves once the user is attached or skipped.
     */
    static async #session_authentication(req, res, next) {
        if (req.session.userId && !req.authenticatedUser) {
            try {
                req.authenticatedUser = await UserModel.getById(req.session.userId)
            } catch (error) {
                console.error("Error in session authentication:", error)
            }
        }
        next()
    }

    /**
     * Display the login page.
     *
     * This asynchronous method renders the login view ("login.ejs") and
     * passes the authenticated user (if any) to the view.
     *
     * @param {express.Request} req - The HTTP request object.
     * @param {express.Response} res - The HTTP response object.
     * @returns {Promise<void>} A promise that resolves after rendering the view.
     */
    static async viewLogin(req, res) {
        res.render("login.ejs", {
            authenticatedUser: req.authenticatedUser
        })
    }

    /**
     * Display the registration page.
     *
     * This asynchronous method renders the registration view ("register.ejs")
     * and passes the current authenticated user (if any) to the view.
     *
     * @param {express.Request} req - The HTTP request object.
     * @param {express.Response} res - The HTTP response object.
     * @returns {Promise<void>} A promise that resolves after rendering the view.
     */
    static async viewRegister(req, res) {
        res.render("register.ejs", { 
            authenticatedUser: req.authenticatedUser 
        })
    }

    /**
     * Process user login.
     *
     * This asynchronous method handles login requests. It validates the email format
     * using the validator library, ensures that the request body is URL encoded,
     * and retrieves the user record from the database using UserModel.getByEmail.
     * Then, it compares the provided password with the stored hashed password using bcrypt.
     * If authentication is successful, the user's ID is stored in the session and the user is redirected.
     * If authentication fails, an error view is rendered.
     *
     * @param {express.Request} req - The HTTP request object containing login data.
     * @param {express.Response} res - The HTTP response object.
     * @returns {Promise<void>} A promise that resolves after processing the login.
     */
    static async handleAuthenticate(req, res) {
        const contentType = req.get("Content-Type")
        const email = req.body.email
        const password = req.body.password

        // Validate email format.
        if (!validator.isEmail(email)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid email address."
            })
            return
        }

        // Check if the request body is URL encoded.
        if (contentType == "application/x-www-form-urlencoded") {
            try {
                // Retrieve user by email.
                const user = await UserModel.getByEmail(email)
                // Compare provided password with stored hashed password.
                const isCorrectPassword = await bcrypt.compare(password, user.password)

                if (isCorrectPassword) {
                    // Save user ID in session and redirect.
                    req.session.userId = user.id
                    res.redirect("/microblog")
                } else {
                    // Render error view for invalid credentials.
                    res.status(400).render("status.ejs", {
                        status: "Authenticate Failed",
                        message: "Invalid credentials",
                        authenticatedUser: req.authenticatedUser
                    })
                }
            } catch (error) {
                // Handle error when user is not found or database error.
                if (error == "not found") {
                    res.status(400).render("status.ejs", {
                        status: "Authenticate Failed",
                        message: "Invalid credentials",
                        authenticatedUser: req.authenticatedUser
                    })
                } else {
                    console.error("Error in handleAuthenticate:", error)
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "Authentication failed",
                        authenticatedUser: req.authenticatedUser
                    })
                }
            }
        } else {
            // Render error view for unsupported content type.
            res.status(400).render("status.ejs", {
                status: "Authenticate Failed",
                message: "Invalid authentication request body",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * Process user logout.
     *
     * This method checks if a user is authenticated. If so, it destroys the session
     * to log the user out and renders the "logout.ejs" view. If no user is authenticated,
     * it renders an error view indicating that login is required.
     *
     * @param {express.Request} req - The HTTP request object.
     * @param {express.Response} res - The HTTP response object.
     */
    static handleDeauthenticate(req, res) {
        if (req.authenticatedUser) {
            if (req.session.userId) {
                req.session.destroy()
                res.status(200).render("logout.ejs", {
                    authenticatedUser: req.authenticatedUser
                })
            }
        } else {
            res.status(401).render("status.ejs", {
                status: "Unauthenticated",
                message: "Please login to access the requested resource",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * Create a middleware to restrict access based on roles.
     *
     * This factory function returns a middleware function that checks if the current
     * authenticated user's role is included in the allowedRoles array.
     * If the role is allowed, it calls the next middleware; otherwise, it renders
     * an error view with an appropriate HTTP status.
     *
     * @param {Array<string>} allowedRoles - List of roles that are permitted.
     * @returns {Function} A middleware function that enforces role-based access.
     */
    static restrict(allowedRoles) {
        return function (req, res, next) {
            if (req.authenticatedUser) {
                if (allowedRoles.includes(req.authenticatedUser.role)) {
                    next()
                } else {
                    res.status(403).render("status.ejs", {
                        status: "Access forbidden",
                        message: "Role does not have access to the requested resource",
                        authenticatedUser: req.authenticatedUser
                    })
                }
            } else {
                res.status(401).render("status.ejs", {
                    status: "Unauthenticated",
                    message: "Please login to access the requested resource",
                    authenticatedUser: req.authenticatedUser
                })
            }
        }
    }
}
