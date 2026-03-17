import { DatabaseModel } from "./DatabaseModel.mjs"
import { SessionModel } from "./SessionModel.mjs"
import { UserModel } from "./UserModel.mjs"
import { ActivityModel } from "./ActivityModel.mjs"
import { LocationModel } from "./LocationModel.mjs"

/**
 * Model for session details.
 *
 * This model holds detailed info about a session.
 * It combines data from sessions, activities, locations, and users.
 * Use this model when you need all session details in one object.
 */
export class SessionDetailsModel extends DatabaseModel {
    /**
     * Create a new SessionDetailsModel instance.
     *
     * @param {SessionModel} session - The session info.
     * @param {ActivityModel} activity - The activity info.
     * @param {LocationModel} location - The location info.
     * @param {UserModel} user - The user info.
     */
    constructor(session, activity, location, user) {
        super()
        this.session = session
        this.activity = activity
        this.location = location
        this.user = user
    }

    /**
     * Make a SessionDetailsModel from a database row.
     *
     * This method takes a row from a query result and returns a new
     * SessionDetailsModel using data from sessions, activities, locations, and users.
     *
     * @param {Object} row - A row from the query result.
     * @returns {SessionDetailsModel} A new SessionDetailsModel instance.
     */
    static tableToModel(row) {
        return new SessionDetailsModel(
            SessionModel.tableToModel(row.sessions),
            ActivityModel.tableToModel(row.activities),
            LocationModel.tableToModel(row.locations),
            UserModel.tableToModel(row.users)
        )
    }

    /**
     * Get all session details with related data.
     *
     * This method gets all session details by joining sessions, activities,
     * locations, and users. It returns rows where none of the records are deleted
     * and the user is a trainer.
     *
     * @returns {Promise<Array<SessionDetailsModel>>} A promise that resolves to an array of SessionDetailsModel.
     */
    static getAllWithDetails() {
        return this.query(`
            SELECT sessions.*, activities.name, locations.name, users.first_name, users.last_name
            FROM sessions
            JOIN activities ON sessions.activity_id = activities.id
            JOIN locations ON sessions.location_id = locations.id
            JOIN users ON sessions.trainer_id = users.id
            WHERE sessions.deleted = 0
            AND activities.deleted = 0 
            AND locations.deleted = 0
            AND users.deleted = 0
            AND users.role = 'trainer'
            `)
            .then(result => result.map(row => this.tableToModel(row)))
    }

    /**
     * Get all session details for a specific trainer.
     *
     * This method gets session details for sessions of a given trainer.
     * It joins sessions, activities, locations, and users and returns rows where
     * the user's id matches the provided trainerId.
     *
     * @param {number} trainerId - The trainer id.
     * @returns {Promise<Array<SessionDetailsModel>>} A promise that resolves to an array of SessionDetailsModel.
     */
    static getAllWithDetailsTrainer(trainerId) {
        return this.query(`
            SELECT sessions.*, activities.name, locations.name, users.first_name, users.last_name
            FROM sessions
            JOIN activities ON sessions.activity_id = activities.id
            JOIN locations ON sessions.location_id = locations.id
            JOIN users ON sessions.trainer_id = users.id
            WHERE sessions.deleted = 0
            AND activities.deleted = 0 
            AND locations.deleted = 0
            AND users.deleted = 0
            AND users.id = ?
            `, [trainerId])
            .then(result => result.map(row => this.tableToModel(row)))
    }

    /**
     * Get all session details for a specific trainer within a date range.
     *
     *
     * @param {number} trainerId - The trainer id.
     * @returns {Promise<Array<SessionDetailsModel>>} A promise that resolves to an array of SessionDetailsModel.
     */
    static getAllWithDetailsTrainerByDate(trainerId, startDate, endDate) {
        return this.query(`
            SELECT sessions.*, activities.name, locations.name, users.first_name, users.last_name
            FROM sessions
            JOIN activities ON sessions.activity_id = activities.id
            JOIN locations ON sessions.location_id = locations.id
            JOIN users ON sessions.trainer_id = users.id
            WHERE sessions.deleted = 0
            AND sessions.date BETWEEN ? AND ?
            AND activities.deleted = 0 
            AND locations.deleted = 0
            AND users.deleted = 0
            AND users.id = ?
            `, [DatabaseModel.toMySqlDate(startDate), DatabaseModel.toMySqlDate(endDate), trainerId])
            .then(result => result.length > 0
                    ? result.map(row => this.tableToModel(row))
                    : Promise.reject("not found"))
    }

    /**
     * Get session details within a date range.
     *
     * This method gets session details for sessions that occur between the
     * given start and end dates. It joins sessions, activities, locations, and users.
     *
     * @param {Date} startDate - The start date.
     * @param {Date} endDate - The end date.
     * @returns {Promise<Array<SessionDetailsModel>>} A promise that resolves to an array of SessionDetailsModel.
     */
    static getSessionsByDateRange(startDate, endDate) {
        return this.query(`
            SELECT sessions.*, activities.*, locations.*, users.first_name, users.last_name
            FROM sessions
            JOIN activities ON sessions.activity_id = activities.id
            JOIN locations ON sessions.location_id = locations.id
            JOIN users ON sessions.trainer_id = users.id
            WHERE sessions.deleted = 0
            AND activities.deleted = 0 
            AND locations.deleted = 0
            AND users.deleted = 0
            AND sessions.date BETWEEN ? AND ?
        `, [DatabaseModel.toMySqlDate(startDate), DatabaseModel.toMySqlDate(endDate)])
            .then(result => result.map(row => this.tableToModel(row)))
    }
}
