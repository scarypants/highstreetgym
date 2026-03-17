import { DatabaseModel } from "./DatabaseModel.mjs"

/**
 * Model for a session.
 *
 * This model represents a session. A session has an id, an activity id,
 * a date, a time, a location id, and a trainer id.
 * It extends DatabaseModel to run database queries.
 */
export class SessionModel extends DatabaseModel {
    /**
     * Create a new SessionModel instance.
     *
     * @param {number|null} id - The session id (null if new).
     * @param {number} activityId - The id of the activity.
     * @param {Date|string} date - The date of the session (Date or string).
     * @param {string} time - The time of the session (in HH:MM format).
     * @param {number} locationId - The id of the location.
     * @param {number} trainerId - The id of the trainer.
     */
    constructor(id, activityId, date, time, locationId, trainerId) {
        super()
        this.id = id
        this.activityId = activityId
        this.date = date
        this.time = time
        this.locationId = locationId
        this.trainerId = trainerId
    }

    /**
     * Make a SessionModel from a database row.
     *
     * This method takes a row from the sessions table and returns a new
     * SessionModel. It converts the date and time to a JavaScript format.
     *
     * @param {Object} row - A row from the sessions table.
     * @returns {SessionModel} A new SessionModel instance.
     */
    static tableToModel(row) {
        return new SessionModel(
            row["id"],
            row["activity_id"],
            DatabaseModel.toJSDate(row["date"]),
            DatabaseModel.toJSTime(row["time"]),
            row["location_id"],
            row["trainer_id"]
        )
    }

    /**
     * Insert a new session into the database.
     *
     * This method adds a new session to the sessions table.
     * It converts the date and time to MySQL format before inserting.
     *
     * @param {SessionModel} session - The session to create.
     * @returns {Promise} A promise with the query result.
     */
    static create(session) {
        return this.query(`
            INSERT INTO sessions
            (activity_id, date, time, location_id, trainer_id)
            VALUES (?, ?, ?, ?, ?)
        `,
            [session.activityId, DatabaseModel.toMySqlDate(session.date), DatabaseModel.toMySqlTime(session.time), session.locationId, session.trainerId]
        )
    }

    /**
     * Get all sessions that are not deleted.
     *
     * This method gets all sessions from the sessions table where deleted is 0.
     * It converts each row to a SessionModel.
     *
     * @returns {Promise<Array<SessionModel>>} A promise that resolves to an array of SessionModel.
     */
    static getAll() {
        return this.query("SELECT * FROM sessions WHERE deleted = 0")
            .then(result => result.map(row => this.tableToModel(row.sessions)))
    }

    /**
     * Get sessions by trainer id.
     *
     * This method gets sessions where deleted is 0 and trainer_id matches.
     * It returns an array of SessionModel if found, or "not found" if none.
     *
     * @param {number} id - The trainer id.
     * @returns {Promise<Array<SessionModel>|string>} A promise with the sessions or "not found".
     */
    static getByTrainerId(id) {
        return this.query(`
            SELECT * FROM sessions 
            WHERE (deleted = 0) AND (trainer_id = ?)
        `, [id])
            .then(result =>
                result.length > 0
                    ? result.map(row => this.tableToModel(row.sessions))
                    : "not found"
            )
    }

    /**
     * Get sessions by date range.
     *
     * This method gets sessions from the sessions table that fall between
     * the given start and end dates. It converts the dates to MySQL format.
     * If sessions are found, it maps them to SessionModel.
     * If none are found, the promise is rejected.
     *
     * @param {Date} startDate - The start date.
     * @param {Date} endDate - The end date.
     * @returns {Promise<Array<SessionModel>>} A promise that resolves to an array of SessionModel.
     */
    static getByDate(startDate, endDate) {
        return this.query(`
            SELECT * FROM sessions 
            WHERE (deleted = 0) AND (date BETWEEN ? AND ?)
        `, [DatabaseModel.toMySqlDate(startDate), DatabaseModel.toMySqlDate(endDate)])
            .then(result =>
                result.length > 0
                    ? result.map(row => this.tableToModel(row.sessions))
                    : Promise.reject("not found")
            )
    }

    /**
     * Update a session in the database.
     *
     * This method updates a session's details in the sessions table.
     * It converts the date and time to MySQL format before updating.
     *
     * @param {SessionModel} session - The session with updated data.
     * @returns {Promise} A promise with the query result.
     */
    static update(session) {
        return this.query(`
            UPDATE sessions
            SET activity_id = ?, date = ?, time = ?, location_id = ?, trainer_id = ?
            WHERE id = ?
        `,
            [session.activityId, DatabaseModel.toMySqlDate(session.date), DatabaseModel.toMySqlTime(session.time), session.locationId, session.trainerId, session.id]
        )
    }

    /**
     * Mark a session as deleted.
     *
     * This method sets deleted to 1 for the session with the given id in the sessions table.
     * It also marks related bookings as deleted in the bookings table.
     *
     * @param {number} id - The id of the session to delete.
     * @returns {Promise} A promise with the query result.
     */
    static delete(id) {
        return this.query(
            "UPDATE sessions SET deleted = 1 WHERE id = ?",
            [id]
        ),
        this.query(
            "UPDATE bookings SET deleted = 1 WHERE session_id = ?",
            [id]
        )
    }
}
