import express from "express"
import { LocationModel } from "../models/LocationModel.mjs"
import { AuthenticationController } from "./AuthenticationController.mjs"

/**
 * Location controller.
 *
 * This controller handles the display and processing of location management.
 * It allows admin users to create, update, or delete locations.
 * It uses the LocationModel to interact with the database and sets up
 * routes that are protected by admin role checks.
 */
export class LocationController {
    static routes = express.Router()

    /**
     * Set up routes for location management.
     *
     * Registers the following routes:
     * - GET "/" and GET "/:id": Display the location management page.
     * - POST "/" and POST "/:id": Process create, update, or delete actions.
     *
     * All routes are restricted to admin users via AuthenticationController.restrict.
     */
    static {
        // GET route: Display the location management page.
        this.routes.get("/", AuthenticationController.restrict(["admin"]), this.viewManageLocation)
        // GET route with an id: Display a specific location on the management page.
        this.routes.get("/:id", AuthenticationController.restrict(["admin"]), this.viewManageLocation)

        // POST route: Process create, update, or delete actions.
        this.routes.post("/", AuthenticationController.restrict(["admin"]), this.handleLocationManagement)
        // POST route with an id: Process actions for a specific location.
        this.routes.post("/:id", AuthenticationController.restrict(["admin"]), this.handleLocationManagement)
    }

    /**
     * Display the manage locations page.
     *
     * This method performs the following steps:
     * 1. Retrieves an optional location id from the URL parameters.
     * 2. Validates the location id to ensure it is a valid number.
     * 3. Retrieves all locations from the database using LocationModel.getAll.
     * 4. If a location id is provided, finds the matching location in the retrieved list.
     *    If not found, an empty location instance is created.
     * 5. Renders the "manage_locations.ejs" view with the list of locations,
     *    the selected location, and the authenticated user data.
     *
     * @param {express.Request} req - The HTTP request. May include a URL parameter "id".
     * @param {express.Response} res - The HTTP response used to render the view.
     * @returns {void}
     */
    static viewManageLocation(req, res) {
        const selectedLocationId = req.params.id

        // Validate the location id if provided.
        if (selectedLocationId && !/^[0-9]+$/.test(selectedLocationId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid location."
            })
            return
        }

        // Retrieve all locations from the database.
        LocationModel.getAll()
            .then(locations => {
                // Find the location with the given id; if not found, create an empty location.
                const selectedLocation = locations.find(e => e.id == selectedLocationId)
                                        ?? new LocationModel(null, "", "")
                // Render the manage locations view with the locations and selected location.
                res.render("manage_locations.ejs", { 
                    locations,
                    selectedLocation,
                    authenticatedUser: req.authenticatedUser
                })
            })
            .catch(error => {
                console.error("Error retrieving locations:", error)
                // Render an error page if retrieving locations fails.
                res.status(500).render("status.ejs", {
                    status: "Failed view error",
                    message: "The location view could not be displayed.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }

    /**
     * Process create, update, or delete actions for a location.
     *
     * This method performs the following:
     * 1. Retrieves an optional location id from the URL parameters and validates it.
     * 2. Extracts form data from the request body, including the action type.
     * 3. Validates the location name:
     *    - It must contain only letters, spaces, or dashes.
     *    - It should be at least 2 characters long.
     * 4. Validates the location address:
     *    - It must be at least 5 characters long.
     *    - It can include letters, numbers, spaces, commas, periods, apostrophes, or dashes.
     * 5. Creates a new instance of LocationModel using the provided data.
     * 6. Depending on the action ("Create", "Update", or "Delete"), calls the corresponding
     *    method on LocationModel to perform the database operation.
     * 7. Redirects to the location management page upon success, or renders an error page if an error occurs.
     *
     * @param {express.Request} req - The HTTP request containing form data in its body.
     * @param {express.Response} res - The HTTP response used to send a response or render a view.
     * @returns {void}
     */
    static handleLocationManagement(req, res) {
        const selectedLocationId = req.params.id

        // Validate the location id if provided.
        if (selectedLocationId && !/^[0-9]+$/.test(selectedLocationId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid location."
            })
            return
        }

        const formData = req.body
        const action = formData.action

        // Validate the location name: must contain only letters, spaces, or dashes.
        if (!formData.name || !/^(?=.*[a-zA-Z])[a-zA-Z\s-]+$/.test(formData.name)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid name, containing only letters, spaces, or dashes."
            })
            return
        }

        // Validate the location address:
        // At least 5 characters and may include letters, numbers, spaces, commas, periods, apostrophes, or dashes.
        if (!formData.address || !/^(?=.*[a-zA-Z0-9])[a-zA-Z0-9,.'-\s]+$/.test(formData.address)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid address, containing allowed characters and at least 5 characters long."
            })
            return
        }

        // Create a new location instance with the provided data.
        const location = new LocationModel(
            selectedLocationId, 
            formData.name,
            formData.address
        )

        // Process the action from the form.
        if (action == "Create") {
            // Create a new location.
            LocationModel.create(location)
                .then(result => {
                    // Redirect to the location management page upon success.
                    res.redirect("/location")
                })
                .catch(error => {
                    console.error("Error creating location:", error)
                    // Render an error page if location creation fails.
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The location could not be created.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } else if (action == "Update") {
            // Update an existing location.
            LocationModel.update(location)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/location")
                    } else {
                        // Render an error if no rows were updated.
                        res.status(500).render("status.ejs", {
                            status: "Location update error",
                            message: "The location could not be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    console.error("Error updating location:", error)
                    // Render an error page if update fails.
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The location could not be updated.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } else if (action == "Delete") {
            // Delete the location.
            LocationModel.delete(location.id)
                .then(result => {
                    if (result.affectedRows > 0) {
                        res.redirect("/location")
                    } else {
                        // Render an error if no rows were deleted.
                        res.status(500).render("status.ejs", {
                            status: "Location deletion error",
                            message: "The location could not be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    console.error("Error deleting location:", error)
                    // Render an error page if deletion fails.
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The location could not be deleted.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } else {
            // Render an error for an unrecognized action.
            res.status(500).render("status.ejs", {
                status: "Invalid action",
                message: "This form doesn't support this action.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }
}
