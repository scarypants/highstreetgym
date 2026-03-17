import { DatabaseModel } from "./DatabaseModel.mjs"

/**
 * Model for a booking.
 *
 * This model represents a booking. It has an id, a member id, and a session id.
 * It extends DatabaseModel so it can run database queries.
 */
export class BookingModel extends DatabaseModel {
    /**
     * Create a new BookingModel instance.
     *
     * @param {number|null} id - The booking id (null if new).
     * @param {number} memberId - The id of the member who booked.
     * @param {number} sessionId - The id of the session booked.
     */
    constructor(id, memberId, sessionId) {
        super()
        this.id = id
        this.memberId = memberId
        this.sessionId = sessionId
    }

    /**
     * Make a BookingModel from a database row.
     *
     * This function takes a row from the bookings table and
     * returns a new BookingModel with id, member_id, and session_id.
     *
     * @param {Object} row - A row from the bookings table.
     * @returns {BookingModel} A new BookingModel instance.
     */
    static tableToModel(row) {
        return new BookingModel(
            row["id"],
            row["member_id"],
            row["session_id"]
        )
    }

    /**
     * Insert a new booking into the database.
     *
     * This method adds a new booking to the bookings table.
     * It uses the memberId and sessionId from the booking.
     *
     * @param {BookingModel} booking - The booking to create.
     * @returns {Promise} A promise for the query result.
     */
    static create(booking) {
        return this.query(`
            INSERT INTO bookings
            (member_id, session_id)
            VALUES (?, ?)
        `, [booking.memberId, booking.sessionId]
        )
    }

    /**
     * Get all bookings that are not deleted.
     *
     * This method selects all bookings where deleted is 0.
     * It maps each row to a BookingModel.
     *
     * @returns {Promise<Array<BookingModel>>} A promise that resolves to an array of BookingModel.
     */
    static getAll() {
        return this.query("SELECT * FROM bookings WHERE deleted = 0")
            .then(result => result.map(row => this.tableToModel(row.bookings)))
    }

    /**
     * Get bookings by member id.
     *
     * This method selects all bookings for a given member id where deleted is 0.
     * It returns an array of BookingModel if found, or "not found" if none.
     *
     * @param {number} id - The member id.
     * @returns {Promise<Array<BookingModel>|string>} A promise that resolves to an array of BookingModel or "not found".
     */
    static getByMemberId(id) {
        return this.query(`
            SELECT * FROM bookings 
            WHERE deleted = 0
            AND member_id = ?
            `, 
            [id])
            .then(result =>
                result.length > 0
                    ? result.map(row => this.tableToModel(row.bookings))
                    : "not found"
            )
    }

    /**
     * Mark a booking as deleted.
     *
     * This method sets the deleted flag to 1 for a booking with the given id.
     *
     * @param {number} id - The id of the booking to delete.
     * @returns {Promise} A promise for the query result.
     */
    static delete(id) {
        return this.query("UPDATE bookings SET deleted = 1 WHERE id = ?", [id])
    }
}
