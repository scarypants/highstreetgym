import { DatabaseModel } from "./DatabaseModel.mjs"
import { UserModel } from "./UserModel.mjs"
import { BookingModel } from "./BookingModel.mjs"

/**
 * Model for BookingUser.
 *
 * This model holds combined data of a booking and the user
 * who made the booking. Use this model when you need all
 * booking and user details in one object.
 */
export class BookingUserModel extends DatabaseModel {
    /**
     * Create a new BookingUserModel instance.
     *
     * @param {BookingModel} booking - The booking info.
     * @param {UserModel} user - The user info who made the booking.
     */
    constructor(booking, user) {
        super()
        this.booking = booking
        this.user = user
    }

    /**
     * Make a BookingUserModel from a database row.
     *
     * This method takes a row from a query result and returns a new
     * BookingUserModel using the bookings and users data.
     *
     * @param {Object} row - A row from the database.
     * @returns {BookingUserModel} A new BookingUserModel instance.
     */
    static tableToModel(row) {
        return new BookingUserModel(
            BookingModel.tableToModel(row.bookings),
            UserModel.tableToModel(row.users)
        )
    }

    /**
     * Get all booking-user details.
     *
     * This method runs a query to get all bookings joined with user data.
     * It selects the first name and last name from the users table.
     * It returns only rows where both the booking and user are not deleted.
     *
     * @returns {Promise<Array<BookingUserModel>>} A promise that resolves to an array of BookingUserModel.
     */
    static getAllWithUser() {
        return this.query(`
            SELECT bookings.*, users.first_name, users.last_name
            FROM bookings
            JOIN users ON bookings.member_id = users.id
            WHERE (bookings.deleted = 0) AND (users.deleted = 0)
            `)
            .then(result => result.map(row => this.tableToModel(row)))
    }

    /**
     * Get booking-user details by user name.
     *
     * This method runs a query to find bookings joined with user data.
     * It searches for bookings where the user's first or last name
     * contains the given name. It returns rows only where both booking
     * and user are not deleted and the user role is "member".
     *
     * @param {string} name - The name to search for.
     * @returns {Promise<Array<BookingUserModel>>} A promise that resolves to an array of BookingUserModel.
     */
    static getByName(name) {
        return this.query(`
        SELECT bookings.*, users.first_name, users.last_name
        FROM bookings
        JOIN users ON bookings.member_id = users.id
        WHERE (bookings.deleted = 0)
        AND (users.deleted = 0)
        AND (users.first_name LIKE ? OR users.last_name LIKE ?)
        AND users.role = 'member'
        `, [`%${name}%`, `%${name}%`])
            .then(result => result.map(row => this.tableToModel(row)))
    }
}
