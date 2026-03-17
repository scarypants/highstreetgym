import express from "express"
import bcrypt from "bcryptjs"
import validator from "validator"
import { UserModel } from "../models/UserModel.mjs"
import { AuthenticationController } from "./AuthenticationController.mjs"
import { SessionModel } from "../models/SessionModel.mjs"

/**
 * User controller.
 *
 * This controller handles user actions such as viewing a profile,
 * managing users, saving user profiles, and handling user management
 * (create, update, delete). Some routes are for all authenticated users,
 * and some are restricted to admin users.
 */
export class UserController {
    static routes = express.Router()

    /**
     * Set up user routes.
     *
     * Routes:
     * - GET "/profile": View current user profile (for admin, trainer, member).
     * - GET "/" and GET "/:id": View and manage users (only for admin).
     * - POST "/profile": Save changes to current user's profile.
     * - POST "/" and POST "/:id": Handle user management actions (create, update, delete).
     *
     * Some routes are restricted using AuthenticationController.restrict.
     */
    static {
        // Route to view the current user's profile.
        this.routes.get("/profile", AuthenticationController.restrict(["admin", "trainer", "member"]), this.viewProfile)

        // Routes to view and manage users (admin only).
        this.routes.get("/", AuthenticationController.restrict(["admin"]), this.viewManageUser)
        this.routes.get("/:id", AuthenticationController.restrict(["admin"]), this.viewManageUser)

        // Route to save changes to the user's profile.
        this.routes.post("/profile", AuthenticationController.restrict(["admin", "trainer", "member"]), this.saveUserProfile)

        // Routes to handle user management actions (create, update, delete).
        this.routes.post("/", this.handleUserManagement)
        this.routes.post("/:id", this.handleUserManagement)
    }

    /**
     * View the profile of the current user.
     *
     * This function gets the user id from the authenticated user in the session.
     * It then retrieves the user details from the database and renders the profile view.
     *
     * @param {express.Request} req - The request object that contains authenticatedUser data.
     * @param {express.Response} res - The response object used to render the view.
     * @returns {void}
     */
    static viewProfile(req, res) {
        const selectedUserId = req.authenticatedUser.id

        // Check that the user id is a valid number.
        if (!/^[0-9]+$/.test(selectedUserId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid user."
            })
            return
        }

        // Get the user details from the database.
        UserModel.getById(selectedUserId)
            .then(user => {
                // Render the profile view with user data.
                res.render("profile.ejs", { 
                    user,
                    authenticatedUser: req.authenticatedUser
                })
            })
            .catch(error => console.log(error))
    }

    /**
     * View the manage users page for admin.
     *
     * This function gets all users from the database. It checks if a user id is
     * provided in the URL and finds the corresponding user. If no user is found,
     * an empty user object is created. Finally, it renders the manage users view.
     *
     * @param {express.Request} req - The request object with URL parameters.
     * @param {express.Response} res - The response object used to render the view.
     * @returns {void}
     */
    static viewManageUser(req, res) {
        const selectedUserId = req.params.id

        // If a user id is provided, validate that it is a number.
        if (selectedUserId && !/^[0-9]+$/.test(selectedUserId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid user."
            })
            return
        }
        
        // Get all users from the database.
        UserModel.getAll()
            .then(users => {
                // Find the selected user or create an empty user.
                const selectedUser = users.find(e => e.id == selectedUserId)
                                        ?? new UserModel(null, "", "", "", "", "", "")
                // Render the manage users view.
                res.render("manage_users.ejs", { 
                    users,
                    selectedUser,
                    authenticatedUser: req.authenticatedUser
                })
            })
            .catch(error => console.log(error))
    }

    /**
     * Save the profile of the current user.
     *
     * This function updates the profile of the logged-in user.
     * It gets the user id from the session and validates form data such as first name,
     * last name, email, and password. If the password is not hashed, it hashes it.
     * Then it updates the user in the database. On success, it redirects to the profile page.
     *
     * @param {express.Request} req - The request object with form data in req.body.
     * @param {express.Response} res - The response object used to render views or redirect.
     * @returns {void}
     */
    static saveUserProfile(req, res) {
        const selectedUserId = req.authenticatedUser.id

        // Validate that the user id is a valid number.
        if (!/^[0-9]+$/.test(selectedUserId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid user."
            })
            return
        }

        const formData = req.body

        // Create a new user object from form data.
        const user = new UserModel(
            selectedUserId, 
            formData.role,
            formData.firstName, 
            formData.lastName, 
            formData.email,
            formData.password
        )
        
        console.log(JSON.stringify(user))

        // Validate first name: only letters, dash, apostrophe, minimum 2 characters.
        if (!formData.firstName || !/^[a-zA-Z\-\']{2,}$/.test(formData.firstName)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid first name, containing only a-z, -, and '."
            })
            return
        }

        // Validate last name: only letters, dash, apostrophe, minimum 2 characters.
        if (!formData.lastName || !/^[a-zA-Z\-\']{2,}$/.test(formData.lastName)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid last name, containing only a-z, -, and '."
            })
            return
        }

        // Validate email format.
        if (!validator.isEmail(formData.email)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid email address."
            })
            return
        }
        
        // Hash the password if it is not already hashed.
        if (!user.password.startsWith("$2a")) {
            user.password = bcrypt.hashSync(user.password)
        }

        // Update the user in the database.
        UserModel.update(user)
            .then(result => {
                if (result.affectedRows > 0) {
                    res.redirect("/user/profile")
                } else {
                    res.status(500).render("status.ejs", {
                        status: "User update error",
                        message: "The user could be found.",
                        authenticatedUser: req.authenticatedUser
                    })
                }
            })
            .catch(error => {
                res.status(500).render("status.ejs", {
                    status: "Database error",
                    message: "The user could not be updated.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }

    /**
     * Handle user management actions (create, update, delete).
     *
     * This function processes form data for user management. It validates the user id (if provided),
     * first name, last name, and email. It then creates a UserModel object from the data.
     * If the password is not hashed, it hashes the password.
     * Depending on the action (Sign Up, Update, or Delete), it calls the appropriate
     * method on UserModel.
     * After the database operation, it redirects or renders an error page.
     *
     * @param {express.Request} req - The request object with URL parameters and form data.
     * @param {express.Response} res - The response object used to redirect or render a view.
     * @returns {void}
     */
    static handleUserManagement(req, res) {
        const selectedUserId = req.params.id

        // Validate user id if provided.
        if (selectedUserId && !/^[0-9]+$/.test(selectedUserId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid user."
            })
            return
        }
        
        const formData = req.body
        const action = formData.action

        // Validate first name: must contain only letters, dash, space, and apostrophe.
        if (!formData.firstName || !/^(?=.*[a-zA-Z-'])[a-zA-Z-'\s]+$/.test(formData.firstName)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid first name, containing only letters, -, space, and '."
            })
            return
        }

        // Validate last name: must contain only letters, dash, space, and apostrophe.
        if (!formData.lastName || !/^(?=.*[a-zA-Z-'])[a-zA-Z-'\s]+$/.test(formData.lastName)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid last name, containing only letters, -, space, and '."
            })
            return
        }

        // Validate email format.
        if (!validator.isEmail(formData.email)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid email address."
            })
            return
        }

        // Create a new user object from the form data.
        const user = new UserModel(
            selectedUserId, 
            formData.role ?? "member",
            formData.firstName, 
            formData.lastName, 
            formData.email,
            formData.password
        )
        
        // Hash the password if it is not already hashed.
        if (!user.password.startsWith("$2a")) {
            user.password = bcrypt.hashSync(user.password)
        }

        console.log("After Hashing: ", user.password)

        // Process the action from the form.
        if (action == "Sign Up") {            
            // Create a new user.
            UserModel.create(user)
                .then(result => {
                    res.redirect("/auth")
                })
                .catch(error => {
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The user could not be created.",
                        authenticatedUser: "unauthorised"
                    })
                })
        } else if (action == "Update") {
            // Update an existing user.
            UserModel.update(user)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/user")
                    } else {
                        res.status(500).render("status.ejs", {
                            status: "User update error",
                            message: "The user could be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The user could not be updated.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } else if (action == "Delete") {
            if (user.role == "member") {
                // Delete member user.
                UserModel.deleteMember(user.id)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/user")
                    } else {
                        res.status(500).render("status.ejs", {
                            status: "User update error",
                            message: "The user could be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The user could not be updated.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
            } else if (user.role == "trainer") {                
                // Check if trainer has sessions.
                console.log(SessionModel.getByTrainerId(user.id))
                SessionModel.getByTrainerId(user.id)
                .then(result => {
                    console.log(result)
                    if (result != "not found") {
                        res.status(500).render("status.ejs", {
                            status: "User update error",
                            message: "You should delete all sessions with this user before delete user.",
                            authenticatedUser: req.authenticatedUser
                        })
                    } else {
                        UserModel.delete(user.id)
                        .then(result => {
                            if (result.affectedRows > 0) {
                                res.redirect("/user")
                            } else {
                                res.status(500).render("status.ejs", {
                                    status: "User update error",
                                    message: "The user could be found.",
                                    authenticatedUser: req.authenticatedUser
                                })
                            }
                        })
                        .catch(error => {
                            res.status(500).render("status.ejs", {
                                status: "Database error",
                                message: "The user could not be updated.",
                                authenticatedUser: req.authenticatedUser
                            })
                        })
                    }
                }).catch(error => {
                    console.error(error)
                })
            } else {
                // Delete admin user.
                UserModel.delete(user.id)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/user")
                    } else {
                        res.status(500).render("status.ejs", {
                            status: "User update error",
                            message: "The user could be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The user could not be updated.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
            }
        } else {
            // Action not recognized.
            res.status(500).render("status.ejs", {
                status: "Invalid action",
                message: "This form doesn't support this action.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }
}
