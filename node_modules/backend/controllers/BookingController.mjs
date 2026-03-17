import express from "express"
import { BookingModel } from "../models/BookingModel.mjs"
import { BookingSessionDetailsModel } from "../models/BookingSessionDetailsModel.mjs"
import { BookingUserModel } from "../models/BookingUserModel.mjs"
import { UserModel } from "../models/UserModel.mjs"
import { SessionDetailsModel } from "../models/SessionDetailsModel.mjs"
import { AuthenticationController } from "./AuthenticationController.mjs"

/**
 * Booking controller.
 *
 * This controller manages the display and processing of booking data.
 * It provides routes for members to view their own bookings and for admins to manage all bookings.
 * It utilizes multiple models to fetch detailed booking, user, and session information.
 */
export class BookingController {
    static routes = express.Router()

    /**
     * Set up routes for booking management.
     *
     * Registers the following routes:
     * - GET "/member": Allows members to view their own bookings.
     * - GET "/" and GET "/:id": Allows admins to view and manage all bookings.
     * - POST "/create": Enables members to create a new booking.
     * - POST "/" and POST "/:id": Processes booking actions (create, delete, etc.) for both admins and members.
     *
     * All routes are protected by role-based access using AuthenticationController.restrict.
     */
    static {
        // Route for members to view their own bookings.
        this.routes.get("/member", AuthenticationController.restrict(["member"]), this.viewMyBookings)
        // Route for admins to view all bookings.
        this.routes.get("/", AuthenticationController.restrict(["admin"]), this.viewManageBooking)
        // Route for admins to view a specific booking by id.
        this.routes.get("/:id", AuthenticationController.restrict(["admin"]), this.viewManageBooking)

        // Route for members to create a new booking.
        this.routes.post("/create", AuthenticationController.restrict(["member"]), this.createBooking)

        // Route to process booking actions for admins and members.
        this.routes.post("/", AuthenticationController.restrict(["admin", "member"]), this.handleBookingManagement)
        // Route to process booking actions for a specific booking id.
        this.routes.post("/:id", AuthenticationController.restrict(["admin", "member"]), this.handleBookingManagement)
    }

    /**
     * Display the bookings for the logged-in member.
     *
     * Retrieves the member's id from the authenticated user stored in the session,
     * then fetches detailed booking information using BookingSessionDetailsModel.getByMemberIdWithDetails.
     * Finally, renders the "my_bookings.ejs" view with the booking data and authenticated user info.
     *
     * @param {express.Request} req - The HTTP request, expected to have req.authenticatedUser with member details.
     * @param {express.Response} res - The HTTP response used to render the view.
     * @returns {void}
     */
    static async viewMyBookings(req, res) {
        const selectedMemberId = req.authenticatedUser.id

        // Validate that the member id is a valid number.
        if (selectedMemberId && !/^[0-9]+$/.test(selectedMemberId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid member."
            })
            return
        }

        // Retrieve detailed booking information for the member.
        BookingSessionDetailsModel.getByMemberIdWithDetails(selectedMemberId)
            .then(bookings => {
                // Render the member bookings view with the retrieved booking data.
                res.render("my_bookings.ejs", { 
                    bookings,
                    authenticatedUser: req.authenticatedUser
                })
            })
            .catch(error => {
                console.error("Error fetching member bookings:", error)
                // Render an error page if booking retrieval fails.
                res.status(500).render("status.ejs", {
                    status: "Failed view error",
                    message: "The booking view could not be displayed.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }

    /**
     * Display the booking management page for admins.
     *
     * This method allows admins to manage all bookings and performs the following:
     * 1. Validates an optional search term from the query string (allows only letters, dashes, apostrophes, and spaces).
     * 2. Validates an optional booking id from the URL parameters.
     * 3. Retrieves data such as member names, session details, and booking details using multiple models.
     * 4. Merges booking data with corresponding member and session details for easier display.
     * 5. Filters the merged bookings if a search term is provided.
     * 6. Determines the selected booking (or creates an empty booking if none is selected).
     * 7. Renders the "manage_bookings.ejs" view with all the aggregated data.
     *
     * @param {express.Request} req - The HTTP request containing query and URL parameters.
     * @param {express.Response} res - The HTTP response used to render the booking management view.
     * @returns {Promise<void>} A promise that resolves after the view is rendered or an error page is displayed.
     */
    static async viewManageBooking(req, res) {
        try {
            const searchTerm = req.query.search || ""

            // Validate the search term: allow only letters, dashes, apostrophes, and spaces (minimum 2 characters).
            if (searchTerm && !/^[a-zA-Z\-\'\ ]{2,}$/.test(searchTerm)) {
                res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid member name, containing only a-z, -, ', and whitespace."
                })
                return
            }

            const selectedBookingId = req.params.id

            // Validate the booking id if provided.
            if (selectedBookingId && !/^[0-9]+$/.test(selectedBookingId)) {
                res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please select a valid booking."
                })
                return
            }

            // Retrieve necessary data from various models.
            const members = await UserModel.getAllMemberName()
            const sessions = await SessionDetailsModel.getAllWithDetails()
            const bookingsWithMember = await BookingUserModel.getAllWithUser()
            const bookingsWithSessionDetails = await BookingSessionDetailsModel.getAllWithDetails()
            const bookings = await BookingModel.getAll()

            // Merge booking data with corresponding member and session details.
            let mergedBookings = bookings.map(booking => {
                const memberInfo = bookingsWithMember.find(member => member.booking.memberId == booking.memberId)
                const sessionInfo = bookingsWithSessionDetails.find(session => session.booking.sessionId == booking.sessionId)

                return {
                    id: booking.id,
                    member: {
                        id: booking.memberId,
                        firstName: memberInfo.user.firstName,
                        lastName: memberInfo.user.lastName
                    },
                    session: {
                        activityName: sessionInfo.activity.name,
                        date: sessionInfo.session.date,
                        time: sessionInfo.session.time,
                        locationName: sessionInfo.location.name,
                        trainerFirstName: sessionInfo.user.firstName,
                        trainerLastName: sessionInfo.user.lastName
                    }
                }
            })

            // If a search term is provided, filter merged bookings based on member name.
            if (searchTerm) {
                const filteredMembers = await BookingUserModel.getByName(searchTerm)
                const memberIds = filteredMembers.map(m => m.booking.memberId)
                mergedBookings = mergedBookings.filter(booking => memberIds.includes(booking.member.id))
            }
            
            // Determine the selected booking; if none is found, create an empty booking instance.
            const selectedBooking = bookings.find(e => e.id == selectedBookingId)
                                        ?? new BookingModel(null, "", "", "")

            // Render the manage bookings view with all the aggregated data.
            res.render("manage_bookings.ejs", { 
                members,
                sessions,
                mergedBookings,
                selectedBooking,
                searchTerm,
                authenticatedUser: req.authenticatedUser
            })
        } catch (error) {
            console.error("Error in viewManageBooking:", error)
            // Render an error page if any exception occurs.
            res.status(500).render("status.ejs", {
                status: "Failed view error",
                message: "The booking view could not be displayed.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * Process booking actions (create, delete, or specific deletion for members).
     *
     * This method handles form submissions for booking management by performing:
     * 1. Validation of the booking id from the URL (if provided).
     * 2. Validation of member id and session id from the form data.
     * 3. Creation of a BookingModel instance using the provided data.
     * 4. Processing the action specified in the form:
     *    - "Create": Creates a new booking.
     *    - "Delete": Deletes the booking and redirects to the booking management page.
     *    - "X": Deletes the booking and redirects members to their bookings page.
     *    - Any other action: Renders an error page.
     *
     * @param {express.Request} req - The HTTP request containing form data and optionally a URL parameter "id".
     * @param {express.Response} res - The HTTP response used to render views or perform redirects.
     * @returns {void}
     */
    static handleBookingManagement(req, res) {
        const selectedBookingId = req.params.id

        // Validate the booking id if provided.
        if (selectedBookingId && !/^[0-9]+$/.test(selectedBookingId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid booking."
            })
            return
        }

        const formData = req.body
        const action = formData.action

        // Validate that the member id is a valid number.
        if (!formData.memberId || !/^[0-9]+$/.test(formData.memberId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid member id."
            })
            return
        }

        // Validate that the session id is a valid number.
        if (!formData.sessionId || !/^[0-9]+$/.test(formData.sessionId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid session id."
            })
            return
        }

        // Create a new booking instance with the provided data.
        const booking = new BookingModel(
            selectedBookingId,
            formData.memberId,
            formData.sessionId
        )

        // Process the action based on the form data.
        if (action == "Create") {
            BookingModel.create(booking)
                .then(result => {
                    // Redirect to the booking management page upon successful creation.
                    res.redirect("/booking")
                })
                .catch(error => {
                    console.error("Error creating booking:", error)
                    // Render an error page if booking creation fails.
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The booking could not be created.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } 
        else if (action == "Delete") {
            BookingModel.delete(booking.id)
                .then(result => {
                    if (result.affectedRows > 0) {
                        // Redirect to the booking management page upon successful deletion.
                        res.redirect("/booking")
                    } else {
                        res.status(500).render("status.ejs", {
                            status: "Booking update error",
                            message: "The booking could not be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    console.error("Error deleting booking:", error)
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The booking could not be deleted.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } 
        else if (action == "X") {
            BookingModel.delete(booking.id)
                .then(result => {
                    if (result.affectedRows > 0) {
                        // Redirect members to their bookings page upon successful deletion.
                        res.redirect("/booking/member")
                    } else {
                        res.status(500).render("status.ejs", {
                            status: "Booking update error",
                            message: "The booking could not be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    console.error("Error deleting booking for member:", error)
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The booking could not be deleted.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } 
        else {
            // Render an error page for any unsupported action.
            res.status(500).render("status.ejs", {
                status: "Invalid action",
                message: "This form doesn't support this action.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * Create a new booking for a member.
     *
     * This method processes the form submission for creating a new booking.
     * It performs the following steps:
     * 1. Validates that the member id and session id from the form are valid numbers.
     * 2. Creates a new BookingModel instance with the provided data.
     * 3. Checks if the member has already booked the session using BookingModel.getByMemberId.
     * 4. If a booking for the session already exists, renders an error page.
     * 5. Otherwise, creates the booking and redirects the member to their bookings page.
     *
     * @param {express.Request} req - The HTTP request containing form data for the new booking.
     * @param {express.Response} res - The HTTP response used to render a view or perform a redirect.
     * @returns {void}
     */
    static createBooking(req, res) {
        const formData = req.body

        console.log("Form Data:", JSON.stringify(formData))

        // Validate that the member id is a valid number.
        if (!formData.memberId || !/^[0-9]+$/.test(formData.memberId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid member id."
            })
            return
        }

        // Validate that the session id is a valid number.
        if (!formData.sessionId || !/^[0-9]+$/.test(formData.sessionId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid session id."
            })
            return
        }

        // Create a new booking instance without an id (for creation).
        const booking = new BookingModel(
            null,
            formData.memberId,
            formData.sessionId
        )

        // Check if the member already booked the given session.
        BookingModel.getByMemberId(booking.memberId)
            .then(result => {
                console.log("Existing Bookings:", JSON.stringify(result))
                const isBooked = result.filter(booked => booked.sessionId == booking.sessionId)
                console.log("Filtered Bookings:", JSON.stringify(isBooked))
                if (result != "not found" && isBooked.length > 0) {
                    // If the session is already booked by the member, render an error page.
                    res.status(500).render("status.ejs", {
                        status: "Booking error",
                        message: "You already booked this session.",
                        authenticatedUser: req.authenticatedUser
                    })                
                } else {
                    // Create the new booking and redirect to the member's bookings page.
                    BookingModel.create(booking)
                        .then(result => {
                            res.redirect("/booking/member")
                        })
                        .catch(error => {
                            console.error("Error creating booking:", error)
                            res.status(500).render("status.ejs", {
                                status: "Database error",
                                message: "The booking could not be created.",
                                authenticatedUser: req.authenticatedUser
                            })
                        })
                }
            })
            .catch(error => {
                console.error("Error checking existing bookings:", error)
                res.status(500).render("status.ejs", {
                    status: "Database error",
                    message: "Error checking existing bookings.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }
}
