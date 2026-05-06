import express from "express"
import { SessionModel } from "../models/SessionModel.mjs"
import { SessionDetailsModel } from "../models/SessionDetailsModel.mjs"
import { ActivityModel } from "../models/ActivityModel.mjs"
import { LocationModel } from "../models/LocationModel.mjs"
import { UserModel } from "../models/UserModel.mjs"
import { AuthenticationController } from "./AuthenticationController.mjs"

/**
 * Session controller.
 *
 * This controller handles all actions related to sessions such as creation, update,
 * deletion, and viewing. It also supports grouping sessions by day and activity
 * for timetable views. Routes are provided for different roles like admin, trainer,
 * and member.
 */
export class SessionController {
    static routes = express.Router()

    /**
     * Set up routes for session management.
     *
     * Registers routes with different URL patterns and HTTP methods.
     * Routes include:
     * - GET "/create/:id/:day": For members to open the booking creation page for a session.
     * - GET "/timetable": For members to view the weekly timetable.
     * - GET "/trainer/timetable": For trainers to view their weekly session timetable.
     * - GET "/trainer" and GET "/trainer/:id": For trainers to manage their own sessions.
     * - GET "/" and GET "/:id": For admins to manage all sessions.
     * - POST "/" and POST "/:id": For creating, updating, or deleting sessions.
     *
     * All routes are protected by role-based restrictions using AuthenticationController.restrict.
     */
    static {
        // For members to create a booking for a session.
        this.routes.get("/create/:id/:day", AuthenticationController.restrict(["member"]), this.viewCreateBooking)
        // For members to view the weekly timetable.
        this.routes.get("/timetable", AuthenticationController.restrict(["member"]), this.viewWeeklyTimetable)

        // For trainers to view their weekly session timetable.
        this.routes.get("/trainer/timetable", AuthenticationController.restrict(["trainer"]), this.viewWeeklyTrainerSession)
        // For trainers to manage their sessions.
        this.routes.get("/trainer", AuthenticationController.restrict(["trainer"]), this.viewManageSessionForTrainer)
        // For trainers to manage a specific session by id.
        this.routes.get("/trainer/:id", AuthenticationController.restrict(["trainer"]), this.viewManageSessionForTrainer)

        // For admins to manage sessions.
        this.routes.get("/", AuthenticationController.restrict(["admin"]), this.viewManageSession)
        // For admins to manage a specific session by id.
        this.routes.get("/:id", AuthenticationController.restrict(["admin"]), this.viewManageSession)        

        // For creating, updating, or deleting sessions by admin, trainer, or member.
        this.routes.post("/", AuthenticationController.restrict(["admin", "trainer", "member"]), this.handleSessionManagement)
        // For session actions on a specific session id.
        this.routes.post("/:id", AuthenticationController.restrict(["admin", "trainer", "member"]), this.handleSessionManagement)
    }

    /**
     * Get sessions grouped by day and activity.
     *
     * This function retrieves all sessions for the current week from the database.
     * It performs the following steps:
     * 1. Calculates the Monday and Sunday dates for the current week.
     * 2. Initializes an object with keys for each day of the week.
     * 3. Fetches sessions between Monday and Sunday using SessionModel.getByDate.
     * 4. For each session, converts the date from "YYYY/MM/DD" to a Date object.
     * 5. Determines the day name for each session (with Sunday handled separately).
     * 6. Groups sessions by day and by their activityId.
     * If no sessions are found, an object with empty groups is returned.
     *
     * @returns {Promise<Object>} A promise that resolves to an object where each key is a day of the week,
     *                            and each value is an object with activity ids as keys and arrays of sessions as values.
     */
    static async getSessionsByDayAndActivity() {
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        const today = new Date()

        // Calculate Monday of the current week.
        const mondayOfThisWeek = new Date(today)
        mondayOfThisWeek.setDate(today.getDate() - (today.getDay() - 1))
        // Calculate Sunday of the current week.
        const sundayOfThisWeek = new Date(mondayOfThisWeek)
        sundayOfThisWeek.setDate(mondayOfThisWeek.getDate() + 6)

        // Initialize an object with keys for each day, each containing an empty object.
        const sessionsByDay = {}
        for (const day of daysOfWeek) {
            sessionsByDay[day] = {}
        }

        // Retrieve all sessions for the current week.
        const sessionsOnThisWeek = await SessionModel.getByDate(mondayOfThisWeek, sundayOfThisWeek)

        // Group sessions by day and activityId if sessions are found.
        if (sessionsOnThisWeek != "not found") {
            for (const session of sessionsOnThisWeek) {
                // Convert session.date from "YYYY/MM/DD" to a Date object.
                const [yearStr, monthStr, dayStr] = session.date.split("/")
                const sessionDate = new Date(yearStr, monthStr - 1, dayStr)
                if (isNaN(sessionDate.getTime())) continue

                // Determine the day name; if getDay() returns 0, use "Sunday", otherwise use the appropriate index.
                const dayName = sessionDate.getDay() === 0 ? "Sunday" : daysOfWeek[sessionDate.getDay() - 1]

                // Initialize an array for the activityId if not already created.
                sessionsByDay[dayName][session.activityId] = sessionsByDay[dayName][session.activityId] || []
                // Add the session to the corresponding group.
                sessionsByDay[dayName][session.activityId].push(session)
            }
        }
        return sessionsByDay
    }

    /**
     * View the session management page for admins.
     *
     * This method is used by admin users to manage sessions.
     * It performs the following actions:
     * 1. Retrieves optional query parameters: searchTerm, startDate, and endDate.
     * 2. Validates the searchTerm (only letters, dashes, apostrophes, and spaces allowed) and date formats.
     * 3. Validates an optional session id from the URL.
     * 4. Fetches data for activities, locations, trainers, and sessions.
     * 5. Retrieves session details with additional information.
     * 6. If a searchTerm is provided, filters session details based on trainer name.
     * 7. If a date range is provided, filters session details by that range.
     * 8. Determines the selected session by id, or creates an empty session if none is found.
     * 9. Renders the "manage_sessions.ejs" view with all collected data.
     *
     * @param {express.Request} req - The HTTP request containing query parameters and URL parameters.
     * @param {express.Response} res - The HTTP response used to render the session management view.
     * @returns {Promise<void>} A promise that resolves when the view is rendered.
     */
    static async viewManageSession(req, res) {
        try {
            const searchTerm = req.query.search || ""
            const startDate = req.query.startDate || ""
            const endDate = req.query.endDate || ""

            // Validate search term if provided.
            if (searchTerm && !/^[a-zA-Z\-\'\ ]{2,}$/.test(searchTerm)) {
                res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid name, containing only a-z, -, ', and whitespace."
                })
                return
            }

            // Validate startDate and endDate if provided.
            if (startDate && endDate && (!validator.isISO8601(startDate) || !validator.isISO8601(endDate))) {
                res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please enter a valid date in the format YYYY-MM-DD."
                })
                return
            }

            const selectedSessionId = req.params.id
            // Validate the session id if provided.
            if (selectedSessionId && !/^[0-9]+$/.test(selectedSessionId)) {
                res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please select a valid session."
                })
                return
            }

            // Retrieve necessary data.
            const activities = await ActivityModel.getAll()
            const locations = await LocationModel.getAll()
            const trainers = await UserModel.getAllTrainerName()
            const sessions = await SessionModel.getAll()
            let sessionsWithDetails = await SessionDetailsModel.getAllWithDetails()

            // Determine selected session; create an empty instance if not found.
            const selectedSession = sessions.find(e => e.id == selectedSessionId)
                                    ?? new SessionModel(null, "", "", "", "", "")

            // If a search term is provided, filter session details by trainer name.
            if (searchTerm) {
                const filteredSessions = await SessionDetailsModel.getByTrainerName(searchTerm)
                const trainerIds = filteredSessions.map(m => m.session.trainerId)
                sessionsWithDetails = await Promise.all(
                    trainerIds.map(trainerId => SessionDetailsModel.getAllWithDetailsTrainer(trainerId))
                ).then(results => results.flat())
            }

            // If a date range is provided, filter session details by date.
            if (startDate && endDate) {
                sessionsWithDetails = await SessionDetailsModel.getSessionsByDateRange(new Date(startDate), new Date(endDate))
            }

            // Render the session management view with all collected data.
            res.render("manage_sessions.ejs", {
                activities,
                locations,
                trainers,
                sessions,
                sessionsWithDetails,
                selectedSession,
                searchTerm,
                startDate,
                endDate,
                authenticatedUser: req.authenticatedUser
            })
        } catch (error) {
            console.error("Error in viewManageSession:", error)
            res.status(500).render("status.ejs", {
                status: "Failed view error",
                message: "The session view could not be displayed.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * View the session management page for trainers.
     *
     * This method is used by trainers to view and manage only their own sessions.
     * It performs the following:
     * 1. Validates an optional session id from the URL.
     * 2. Retrieves activities, locations, and all sessions.
     * 3. Fetches session details specific to the logged-in trainer.
     * 4. Determines the selected session by id or creates an empty session if none is found.
     * 5. Renders the "manage_sessions_trainers.ejs" view with the collected data.
     *
     * @param {express.Request} req - The HTTP request containing the trainer's information and optional session id.
     * @param {express.Response} res - The HTTP response used to render the trainer session management view.
     * @returns {Promise<void>} A promise that resolves when the view is rendered.
     */
    static async viewManageSessionForTrainer(req, res) {
        try {
            const selectedSessionId = req.params.id
            if (selectedSessionId && !/^[0-9]+$/.test(selectedSessionId)) {
                res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please select a valid session."
                })
                return
            }

            const activities = await ActivityModel.getAll()
            const locations = await LocationModel.getAll()
            const sessions = await SessionModel.getAll()
            // Get session details for the logged-in trainer.
            const sessionsWithDetails = await SessionDetailsModel.getAllWithDetailsTrainer(req.authenticatedUser.id)
            const selectedSession = sessions.find(e => e.id == selectedSessionId)
                                    ?? new SessionModel(null, "", "", "", "", "")

            res.render("manage_sessions_trainers.ejs", {
                activities,
                locations,
                sessionsWithDetails,
                selectedSession,
                authenticatedUser: req.authenticatedUser
            })
        } catch (error) {
            console.error("Error in viewManageSessionForTrainer:", error)
            res.status(500).render("status.ejs", {
                status: "Failed view error",
                message: "The session view could not be displayed.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * View the weekly timetable for members.
     *
     * This method retrieves all activities and sessions grouped by day and activity,
     * then renders the "weekly_timetable.ejs" view. It is used by members to see their weekly schedule.
     *
     * @param {express.Request} req - The HTTP request containing user information.
     * @param {express.Response} res - The HTTP response used to render the timetable view.
     * @returns {Promise<void>} A promise that resolves when the view is rendered.
     */
    static async viewWeeklyTimetable(req, res) {
        try {
            const activities = await ActivityModel.getAll()
            const sessionsByDay = await SessionController.getSessionsByDayAndActivity()

            res.render("weekly_timetable.ejs", {
                sessionsByDay,
                activities,
                authenticatedUser: req.authenticatedUser
            })
        } catch (error) {
            console.error("Error in viewWeeklyTimetable:", error)
            res.status(500).render("status.ejs", {
                status: "Failed view error",
                message: "The timetable view could not be displayed.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * View the weekly timetable for trainers.
     *
     * This method calculates the current week's Monday and Sunday,
     * then creates a grouping object with keys for each day and empty arrays for each activity.
     * It fetches sessions for the current week and session details for the logged-in trainer,
     * groups the sessions by day and activity id, and renders the "weekly_timetable_trainers.ejs" view.
     *
     * @param {express.Request} req - The HTTP request containing the trainer's information.
     * @param {express.Response} res - The HTTP response used to render the timetable view.
     * @returns {Promise<void>} A promise that resolves when the view is rendered.
     */
    static async viewWeeklyTrainerSession(req, res) {
        try {
            const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            const today = new Date()

            // Calculate Monday of the current week.
            const mondayOfThisWeek = new Date()
            mondayOfThisWeek.setDate(today.getDate() - (today.getDay() - 1))
            // Calculate Sunday of the current week.
            const sundayOfThisWeek = new Date(mondayOfThisWeek)
            sundayOfThisWeek.setDate(mondayOfThisWeek.getDate() + 6)

            const activities = await ActivityModel.getAll()

            // Initialize sessionsByDay object with days and empty arrays for each activity.
            const sessionsByDay = {}
            for (const day of daysOfWeek) {
                sessionsByDay[day] = {}
                for (const activity of activities) {
                    sessionsByDay[day][activity.id] = []
                }
            }
            
            // Retrieve sessions for the current week.
            const sessionsOnThisWeek = await SessionModel.getByDate(mondayOfThisWeek, sundayOfThisWeek)
            // Retrieve session details for the logged-in trainer.
            const sessions = await SessionDetailsModel.getAllWithDetailsTrainer(req.authenticatedUser.id)

            // Group sessions by day and activity.
            if (sessionsOnThisWeek !== "not found") {
                sessions.forEach(session => {
                    // Find matching session from this week.
                    const matchedSessions = sessionsOnThisWeek.filter(s => s.id == session.session.id)
                    matchedSessions.forEach(sessionOnThisWeek => {
                        // Convert date from "YYYY/MM/DD" to Date object.
                        const [yearStr, monthStr, dayStr] = sessionOnThisWeek.date.split("/")
                        sessionOnThisWeek.date = new Date(yearStr, monthStr - 1, dayStr)

                        // Determine the day name (if getDay() returns 0, then Sunday; otherwise adjust index).
                        const sessionDayName = sessionOnThisWeek.date.getDay() == 0 
                            ? daysOfWeek[6] 
                            : daysOfWeek[sessionOnThisWeek.date.getDay() - 1]

                        const activityId = sessionOnThisWeek.activityId 
                        sessionsByDay[sessionDayName][activityId].push(session)
                    })
                })
            }

            // Render the trainer's weekly timetable view.
            res.render("weekly_timetable_trainers.ejs", {
                sessionsByDay,
                authenticatedUser: req.authenticatedUser
            })
        } catch (error) {
            console.error("Error in viewWeeklyTrainerSession:", error)
            res.status(500).render("status.ejs", {
                status: "Failed view error",
                message: "The timetable view could not be displayed.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * View the booking creation page for a session.
     *
     * This method is used by members to create a booking for a specific session.
     * It performs the following steps:
     * 1. Retrieves the activity id and day from URL parameters.
     * 2. Validates the activity id and checks that the day is one of the valid week days.
     * 3. Retrieves sessions grouped by day and activity using getSessionsByDayAndActivity.
     * 4. Fetches all session details.
     * 5. Filters the sessions to get only those that match the selected day and activity.
     * 6. Renders the "create_booking.ejs" view with the filtered sessions.
     *
     * @param {express.Request} req - The HTTP request containing URL parameters "id" (activity id) and "day".
     * @param {express.Response} res - The HTTP response used to render the booking creation view.
     * @returns {Promise<void>} A promise that resolves when the view is rendered.
     */
    static async viewCreateBooking(req, res) {
        try {
            const activityId = req.params.id
            const day = req.params.day

            // Validate activity id.
            if (!activityId || !/^[0-9]+$/.test(activityId)) {
                res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please select a valid activity."
                })
                return
            }

            // Validate day parameter.
            const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            if (!validDays.includes(day)) {
                res.status(400).render("status.ejs", {
                    status: "Invalid input provided.",
                    message: "Please select a valid day."
                })
                return
            }
            
            // Retrieve sessions grouped by day and activity.
            const sessionsByDay = await SessionController.getSessionsByDayAndActivity()
            // Retrieve all session details.
            const sessionsWithDetails = await SessionDetailsModel.getAllWithDetails()

            // Get sessions for the specified day and activity.
            const thisSessions = sessionsByDay[day][activityId]
            const sessions = sessionsWithDetails.filter(e => 
                thisSessions.some(session => session.id == e.session.id)
            )

            // Render the booking creation view.
            res.render("create_booking.ejs", {
                sessions,
                day,
                activityId,
                authenticatedUser: req.authenticatedUser
            })
        } catch (error) {
            console.error("Error in viewCreateBooking:", error)
            res.status(500).render("status.ejs", {
                status: "Failed view error",
                message: "The booking creation view could not be displayed.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }

    /**
     * Handle session management actions (create, update, delete).
     *
     * This method processes form data submitted from the session management page.
     * It performs the following:
     * 1. Validates the optional session id from the URL.
     * 2. Validates that the activity id from the form is a valid number.
     * 3. Validates that the date is in "YYYY/MM/DD" format and represents a date after today.
     * 4. Validates that the time is in "HH:MM" format.
     * 5. Validates that location and trainer ids are valid numbers.
     * 6. Converts the date string into a Date object.
     * 7. Creates a new SessionModel instance with the provided data.
     * 8. Based on the action ("Create", "Update", or "Delete"), calls the corresponding method on SessionModel.
     * 9. Redirects the user based on their role (trainer or admin) if the operation is successful,
     *    or renders an error page if any operation fails.
     *
     * @param {express.Request} req - The HTTP request containing form data.
     * @param {express.Response} res - The HTTP response used to redirect or render an error view.
     * @returns {void}
     */
    static handleSessionManagement(req, res) {
        const selectedSessionId = req.params.id

        // Validate session id if provided.
        if (selectedSessionId && !/^[0-9]+$/.test(selectedSessionId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid session."
            })
            return
        }

        const formData = req.body
        const action = formData.action

        // Validate activity id.
        if (!formData.activityId || !/^[0-9]+$/.test(formData.activityId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid activity."
            })
            return
        }

        // Validate and convert the date.
        const inputDate = new Date(formData.date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (inputDate <= today) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a date that is after today."
            })
            return
        }
        if (!formData.date || !/^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(formData.date)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid date in the format YYYY/MM/DD."
            })
            return
        }

        // Validate the time format (HH:MM).
        if (!formData.time || !/^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/.test(formData.time)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter a valid time in the format HH:MM."
            })
            return
        }

        // Validate location id.
        if (!formData.locationId || !/^[0-9]+$/.test(formData.locationId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid location."
            })
            return
        }

        // Validate trainer id.
        if (!formData.trainerId || !/^[0-9]+$/.test(formData.trainerId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid trainer."
            })
            return
        }

        // Convert the date string from YYYY/MM/DD to a Date object.
        const [year, month, day] = formData.date.split("/")
        const dateObj = new Date(year, month - 1, day)

        // Create a new SessionModel instance with the provided data.
        const session = new SessionModel(
            selectedSessionId, 
            formData.activityId, 
            dateObj, 
            formData.time, 
            formData.locationId, 
            formData.trainerId
        )

        console.log("Session Object:", session)

        // Process the action specified in the form.
        if (action == "Create") {
            SessionModel.create(session)
                .then(result => {
                    // Redirect based on user role.
                    if (req.authenticatedUser.role == "trainer") {
                        res.redirect("/session/trainer")
                    } else if (req.authenticatedUser.role == "admin") {
                        res.redirect("/session")
                    } else {
                        res.status(403).render("status.ejs", {
                            status: "Access forbidden",
                            message: "Role does not have access to the requested resource",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The session could not be created.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } else if (action == "Update") {
            SessionModel.update(session)
                .then(result => {
                    if (req.authenticatedUser.role == "trainer") {
                        res.redirect("/session/trainer")
                    } else if (req.authenticatedUser.role == "admin") {
                        res.redirect("/session")
                    } else {
                        res.status(500).render("status.ejs", {
                            status: "Session update error",
                            message: "The session could not be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The session could not be updated.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } else if (action == "Delete") {
            SessionModel.delete(session.id)
                .then(result => {
                    if (req.authenticatedUser.role == "trainer") {
                        res.redirect("/session/trainer")
                    } else if (req.authenticatedUser.role == "admin") {
                        res.redirect("/session")
                    } else {
                        res.status(500).render("status.ejs", {
                            status: "Session deletion error",
                            message: "The session could not be found.",
                            authenticatedUser: req.authenticatedUser
                        })
                    }
                })
                .catch(error => {
                    res.status(500).render("status.ejs", {
                        status: "Database error",
                        message: "The session could not be deleted.",
                        authenticatedUser: req.authenticatedUser
                    })
                })
        } else {
            res.status(500).render("status.ejs", {
                status: "Invalid action",
                message: "This form doesn't support this action.",
                authenticatedUser: req.authenticatedUser
            })
        }
    }
}
