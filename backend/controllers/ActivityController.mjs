import express from "express"
import validator from "validator"
import { ActivityModel } from "../models/ActivityModel.mjs"
import { AuthenticationController } from "./AuthenticationController.mjs"

/**
 * Activity management controller.
 *
 * This controller manages create, update, and delete operations for activities.
 * It defines routes that are restricted to admin users and uses the ActivityModel
 * to interact with the database. The controller handles HTTP requests for displaying
 * the manage activities page and processing form submissions to create, update, or
 * delete an activity.
 */
export class ActivityController {
    static routes = express.Router()

    /**
     * Set up routes for activity management.
     *
     * This static block registers the following routes:
     * - GET "/" and GET "/:id": Show the manage activities page.
     * - POST "/" and POST "/:id": Process create, update, or delete operations.
     *
     * All routes are protected by an admin role check using AuthenticationController.restrict.
     */
    static {
        // GET route: Show page to manage activities.
        this.routes.get("/", AuthenticationController.restrict(["admin"]), this.viewManageActivity)
        // GET route with an id: Show a specific activity.
        this.routes.get("/:id", AuthenticationController.restrict(["admin"]), this.viewManageActivity)

        // POST route: Process create, update, or delete actions.
        this.routes.post("/", AuthenticationController.restrict(["admin"]), this.handleActivityManagement)
        // POST route with an id: Process actions for a specific activity.
        this.routes.post("/:id", AuthenticationController.restrict(["admin"]), this.handleActivityManagement)
    }

    /**
     * Show the manage activities page.
     *
     * This method retrieves all activities from the database using ActivityModel.getAll.
     * It checks if an activity ID is provided in the request parameters and validates it.
     * If the provided ID is invalid, it renders an error page with a 400 status.
     * If the ID is valid, it searches for the matching activity. If none is found,
     * it creates a new empty activity instance.
     * Finally, it renders the "manage_activities.ejs" view with the list of activities,
     * the selected activity, and the authenticated user data.
     *
     * @param {express.Request} req - The HTTP request. May include a URL parameter "id".
     * @param {express.Response} res - The HTTP response used to render views or send responses.
     * @returns {void} Does not return a value; it renders a view or sends an HTTP response.
     */
    static viewManageActivity(req, res) {
        const selectedActivityId = req.params.id

        // Check if the activity id exists and is a valid number.
        if (selectedActivityId && !/^[0-9]+$/.test(selectedActivityId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid activity."
            })
            return
        }

        // Retrieve all activities from the database.
        ActivityModel.getAll()
            .then(activities => {
                // Find the activity with the provided id.
                // If not found, create an empty activity.
                const selectedActivity = activities.find(e => e.id == selectedActivityId)
                                        ?? new ActivityModel(null, "", "", "")

                // Render the manage activities page.
                res.render("manage_activities.ejs", { 
                    activities,
                    selectedActivity,
                    authenticatedUser: req.authenticatedUser
                })
            })
            .catch(error => {
                console.error("Error retrieving activities:", error)
                // Render an error page if there is a database error.
                res.status(500).render("status.ejs", {
                    status: "Failed view error",
                    message: "The booking view could be found.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }

    /**
     * Process create, update, or delete activity.
     *
     * This method processes the form submission for an activity action.
     * It performs the following steps:
     * 1. Validates the activity ID from the URL parameters (if provided).
     * 2. Extracts form data from the request body.
     * 3. Validates the activity name, which must contain only capital letters, spaces, or dashes.
     * 4. Validates the duration, which must be in the format "00min" (with at least two digits).
     * 5. Validates the description to be 1-255 characters long.
     *
     * Based on the action specified in the form data ("Create", "Update", or "Delete"),
     * it calls the corresponding method on the ActivityModel:
     * - "Create": Calls ActivityModel.create(activity).
     * - "Update": Calls ActivityModel.update(activity).
     * - "Delete": Calls ActivityModel.delete(activity.id).
     *
     * If the database operation is successful, the user is redirected to "/activity".
     * If the operation fails, an error page is rendered with a 500 status.
     *
     * @param {express.Request} req - The HTTP request containing form data.
     * @param {express.Response} res - The HTTP response used to render views or send responses.
     * @returns {void} Does not return a value; it redirects the user or renders an error page.
     */
    static handleActivityManagement(req, res) {
        const selectedActivityId = req.params.id

        // Validate the activity id if provided.
        if (selectedActivityId && !/^[0-9]+$/.test(selectedActivityId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid activity."
            })
            return
        }

        const formData = req.body
        const action = formData.action

        // Validate the activity name: must contain only capital letters, spaces, or dashes.
        if (!formData.name || !/^(?=.*[A-Z])[A-Z\s]+$/.test(formData.name)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid name, containing only capital letter, -, and whitespace."
            })
            return
        }

        // Validate the duration: must be in the format "00min" with at least two digits.
        if (!formData.duration || !/^[0-9]{2,}\s*min$/.test(formData.duration)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid duration in the format '00min'."
            })
            return
        }

        // Validate the description: length must be between 1 and 255 characters.
        if (!formData.description || !validator.isLength(formData.description, { min: 1, max: 255 })) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid description (1-255 characters)."
            })
            return
        }

        // Create an activity object with the provided form data.
        const activity = new ActivityModel(
            selectedActivityId, 
            formData.name, 
            formData.duration, 
            formData.description
        )

        // Process the action specified in the form data.
        if (action == "Create") {
            ActivityModel.create(activity)
                .then(result => {
                    // Redirect on successful creation.
                    res.redirect("/activity")
                })
                .catch(error => {
                    console.error("Error creating activity:", error)
                    // Render an error page if creation fails.
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The activity could not be created.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } 
        else if (action == "Update") {
            ActivityModel.update(activity)
                .then(result => {
                    if (result.affectedRows > 0) {
                        // Redirect on successful update.
                        res.redirect("/activity")
                    } else {
                        // Render error if no rows were updated.
                        res.status(500).render("status.ejs", {
                            status: "Activity update error",
                            message: "The activity could be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    console.error("Error updating activity:", error)
                    // Render an error page if update fails.
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The activity could not be updated.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } 
        else if (action == "Delete") {
            ActivityModel.delete(activity.id)
                .then(result => {
                    if (result.affectedRows > 0) {
                        // Redirect on successful deletion.
                        res.redirect("/activity")
                    } else {
                        // Render error if no rows were deleted.
                        res.status(500).render("status.ejs", {
                            status: "Activity update error",
                            message: "The activity could be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    console.error("Error deleting activity:", error)
                    // Render an error page if deletion fails.
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The activity could not be deleted.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } 
        else {
            // Render an error for unsupported actions.
            res.status(500).render("status.ejs", {
                status: "Invalid action",
                message: "This form doesn't support this action.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }
}
