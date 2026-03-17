import { DatabaseModel } from "./DatabaseModel.mjs"
import { BookingModel } from "./BookingModel.mjs"
import { SessionModel } from "./SessionModel.mjs"
import { UserModel } from "./UserModel.mjs"
import { ActivityModel } from "./ActivityModel.mjs"
import { LocationModel } from "./LocationModel.mjs"

/**
 * Model for booking session details.
 *
 * This model shows detailed info of a booking.
 * It combines data from bookings, sessions, activities, locations, and users.
 * Use this model when you need all booking details in one object.
 */
export class BookingSessionDetailsModel extends DatabaseModel {
    /**
     * Create a new BookingSessionDetailsModel instance.
     *
     * @param {BookingModel} booking - The booking info.
     * @param {SessionModel} session - The session info.
     * @param {ActivityModel} activity - The activity info.
     * @param {LocationModel} location - The location info.
     * @param {UserModel} user - The user info.
     */
    constructor(booking, session, activity, location, user) {
        super()
        this.booking = booking
        this.session = session
        this.activity = activity
        this.location = location
        this.user = user
    }

    /**
     * Make a BookingSessionDetailsModel from a database row.
     *
     * This method takes a row from a query result and returns
     * a new BookingSessionDetailsModel with booking, session,
     * activity, location, and user details.
     *
     * @param {Object} row - A row from the database.
     * @returns {BookingSessionDetailsModel} A new instance.
     */
    static tableToModel(row) {
        return new BookingSessionDetailsModel(
            BookingModel.tableToModel(row.bookings),
            SessionModel.tableToModel(row.sessions),
            ActivityModel.tableToModel(row.activities),
            LocationModel.tableToModel(row.locations),
            UserModel.tableToModel(row.users)
        )
    }

    /**
     * Get booking details by member id.
     *
     * This method gets detailed booking info for a given member.
     * It joins the bookings, sessions, activities, locations, and users tables.
     * It returns only rows that are not deleted and where the user is a trainer.
     *
     * @param {number} memberId - The member id.
     * @returns {Promise<Array<BookingSessionDetailsModel>>} A promise that resolves to an array of booking details.
     */
    static getByMemberIdWithDetails(memberId) {
        return this.query(`
            SELECT bookings.*, sessions.*,
            activities.name, locations.name, users.first_name, users.last_name
            FROM bookings
            JOIN sessions ON bookings.session_id = sessions.id
            JOIN activities ON sessions.activity_id = activities.id
            JOIN locations ON sessions.location_id = locations.id
            JOIN users ON sessions.trainer_id = users.id
            WHERE bookings.deleted = 0
            AND sessions.deleted = 0
            AND activities.deleted = 0 
            AND locations.deleted = 0
            AND users.deleted = 0
            AND users.role = 'trainer'
            AND bookings.member_id = ?
        `,
            [memberId]
        ).then(result => result.map(row => this.tableToModel(row)))
    }

    /**
     * Get all booking details.
     *
     * This method gets detailed booking info for all bookings.
     * It joins the bookings, sessions, activities, locations, and users tables.
     * It returns only rows that are not deleted and where the user is a trainer.
     *
     * @returns {Promise<Array<BookingSessionDetailsModel>>} A promise that resolves to an array of booking details.
     */
    static getAllWithDetails() {
        return this.query(`
            SELECT bookings.*, sessions.*, 
            activities.name, locations.name, users.first_name, users.last_name
            FROM bookings
            JOIN sessions ON bookings.session_id = sessions.id
            JOIN activities ON sessions.activity_id = activities.id
            JOIN locations ON sessions.location_id = locations.id
            JOIN users ON sessions.trainer_id = users.id
            WHERE bookings.deleted = 0
            AND sessions.deleted = 0
            AND activities.deleted = 0 
            AND locations.deleted = 0
            AND users.deleted = 0
            AND users.role = 'trainer'
        `).then(result => result.map(row => this.tableToModel(row)))
    }
}
