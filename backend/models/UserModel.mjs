// Import the DatabaseModel from another file
import { DatabaseModel } from "../models/DatabaseModel.mjs"

// Export user role constants
export const USER_MEMBER = "member"
export const USER_TRAINER = "trainer"
export const USER_ADMIN = "admin"

/**
 * Model for a user.
 *
 * This model represents a user. It holds user data and runs database queries.
 * It extends DatabaseModel to use common query methods.
 */
export class UserModel extends DatabaseModel {

    /**
     * Create a new UserModel instance.
     *
     * @param {number|string|null} id - The user's id.
     * @param {string} role - The user's role (member, trainer, or admin).
     * @param {string} firstName - The user's first name.
     * @param {string} lastName - The user's last name.
     * @param {string} email - The user's email address.
     * @param {string} password - The user's password.
     * @param {string} authenticationKey - The user's authentication key.
     */
    constructor(id, role, firstName, lastName, email, password, authenticationKey) {
        super()
        // Set the properties with the provided values.
        this.id = id
        this.role = role
        this.firstName = firstName
        this.lastName = lastName
        this.email = email
        this.password = password
        this.authenticationKey = authenticationKey
    }

    /**
     * Make a UserModel from a database row.
     *
     * This method takes a row from the database and returns a new UserModel.
     *
     * @param {Object} row - A row from the database.
     * @returns {UserModel} A new UserModel instance.
     */
    static tableToModel(row) {
        return new UserModel(
            row["id"],
            row["role"],
            row["first_name"],
            row["last_name"],
            row["email"],
            row["password"],
            row["authentication_key"]
        )
    }

    /**
     * Insert a new user into the database.
     *
     * This method adds a new user to the users table.
     *
     * @param {UserModel} user - The user object to insert.
     * @returns {Promise} A promise with the query result.
     */
    static create(user) {
        return this.query(
            `INSERT INTO users
            (role, first_name, last_name, email, password, authentication_key)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [user.role, user.firstName, user.lastName, user.email, user.password, user.authenticationKey]
        )
    }

    /**
     * Get all users that are not deleted.
     *
     * This method selects all rows from the users table where deleted is 0.
     * It converts each row into a UserModel.
     *
     * @returns {Promise<Array<UserModel>>} A promise that resolves to an array of UserModel.
     */
    static getAll() {
        return this.query("SELECT * FROM users WHERE deleted = 0")
            .then(result => result.map(row => this.tableToModel(row.users)))
    }

    /**
     * Get all users with the role "trainer".
     *
     * This method selects all users with role 'trainer' that are not deleted.
     *
     * @returns {Promise<Array<UserModel>>} A promise that resolves to an array of UserModel.
     */
    static getAllTrainerName() {
        return this.query(
            `SELECT users.*
            FROM users
            WHERE users.deleted = 0
            AND users.role = 'trainer'`
        )
            .then(result => result.map(row => this.tableToModel(row.users)))
    }

    /**
     * Get all users with the role "member".
     *
     * This method selects all users with role 'member' that are not deleted.
     *
     * @returns {Promise<Array<UserModel>>} A promise that resolves to an array of UserModel.
     */
    static getAllMemberName() {
        return this.query(
            `SELECT users.*
            FROM users
            WHERE users.deleted = 0
            AND users.role = 'member'`
        )
            .then(result => result.map(row => this.tableToModel(row.users)))
    }

    /**
     * Get a user by their id.
     *
     * This method selects a user from the users table by id,
     * only if deleted is 0.
     *
     * @param {number|string} id - The user's id.
     * @returns {Promise<UserModel>} A promise that resolves to a UserModel.
     */
    static getById(id) {
        return this.query("SELECT * FROM users WHERE deleted = 0 AND id = ?", [id])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0].users)
                    : Promise.reject("not found")
            )
    }

    /**
     * Get a user by their email address.
     *
     * This method selects a user from the users table by email,
     * only if deleted is 0.
     *
     * @param {string} email - The user's email.
     * @returns {Promise<UserModel>} A promise that resolves to a UserModel.
     */
    static getByEmail(email) {
        return this.query("SELECT * FROM users WHERE deleted = 0 AND email = ?", [email])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0].users)
                    : Promise.reject("not found")
            )
    }

    /**
     * 
     * @param {number} authenticationKey 
     * @returns {Promise<UserModel>}
     */
    static getByAuthenticationKey(authenticationKey) {
        return this.query("SELECT * FROM users WHERE authentication_key = ? AND deleted = 0", [authenticationKey])
            .then(result =>
                result.length > 0
                    ? this.tableToModel(result[0].users)
                    : Promise.reject("not found")
            )
    }

    /**
     * Update a user in the database.
     *
     * This method updates a user's data in the users table.
     *
     * @param {UserModel} user - The user with new data.
     * @returns {Promise} A promise with the query result.
     */
    static update(user) {
        return this.query(
            `UPDATE users
            SET role = ?, first_name = ?, last_name = ?, email = ?, password = ?, authentication_key = ?
            WHERE id = ?`,
            [user.role, user.firstName, user.lastName, user.email, user.password, user.authenticationKey, user.id]
        )
    }

    /**
     * Mark a user as deleted.
     *
     * This method sets the deleted flag to 1 for a user.
     *
     * @param {number|string} id - The user's id.
     * @returns {Promise} A promise with the query result.
     */
    static delete(id) {
        return this.query(
            "UPDATE users SET deleted = 1 WHERE id = ?",
            [id]
        )
    }

    /**
     * Mark a member as deleted.
     *
     * This method sets the deleted flag to 1 for a member.
     * It also marks bookings with this member id as deleted.
     *
     * @param {number|string} id - The member's id.
     * @returns {Promise} A promise with the query result.
     */
    static deleteMember(id) {
        return this.query(
            "UPDATE users SET deleted = 1 WHERE id = ?",
            [id]
        ),
        this.query(
            "UPDATE bookings SET deleted = 1 WHERE member_id = ?",
            [id]
        )
    }
}
