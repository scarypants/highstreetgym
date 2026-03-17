import { DatabaseModel } from "./DatabaseModel.mjs"

/**
 * Model for an activity.
 *
 * This model represents an activity. It extends DatabaseModel to run database queries.
 * An activity has an id, a name, a duration, and a description.
 */
export class ActivityModel extends DatabaseModel {
    /**
     * Create an ActivityModel instance.
     *
     * @param {number|null} id - The activity id (null if new).
     * @param {string} name - The activity name.
     * @param {string} duration - The activity duration (e.g., "45min").
     * @param {string} description - A short description.
     */
    constructor(id, name, duration, description) {
        super()
        this.id = id
        this.name = name
        this.duration = duration
        this.description = description
    }

    /**
     * Make an ActivityModel from a database row.
     *
     * @param {Object} row - A row from the database table.
     * @returns {ActivityModel} A new ActivityModel instance.
     */
    static tableToModel(row) {
        return new ActivityModel(
            row["id"],
            row["name"],
            row["duration"],
            row["description"]
        )
    }

    /**
     * Insert a new activity into the database.
     *
     * @param {ActivityModel} activity - The activity to create.
     * @returns {Promise} A promise for the query result.
     */
    static create(activity) {
        return this.query(`
            INSERT INTO activities
            (name, duration, description)
            VALUES (?, ?, ?)
        `,
            [activity.name, activity.duration, activity.description]
        )
    }

    /**
     * Get all activities that are not deleted.
     *
     * This method selects all rows from the activities table where deleted is 0.
     * It converts each row into an ActivityModel.
     *
     * @returns {Promise<Array<ActivityModel>>} A promise that resolves to an array of ActivityModel.
     */
    static getAll() {
        return this.query("SELECT * FROM activities WHERE deleted = 0")
            .then(result => result.map(row => this.tableToModel(row.activities)))
    }

    /**
     * Update an activity in the database.
     *
     * This method updates the name, duration, and description of an activity.
     *
     * @param {ActivityModel} activity - The activity with updated data.
     * @returns {Promise} A promise for the query result.
     */
    static update(activity) {
        return this.query(`
            UPDATE activities
            SET name = ?, duration = ?, description = ?
            WHERE id = ?
        `,
            [activity.name, activity.duration, activity.description, activity.id]
        )
    }

    /**
     * Mark an activity as deleted.
     *
     * This method sets the deleted flag to 1 for a given activity id.
     *
     * @param {number} id - The id of the activity to delete.
     * @returns {Promise} A promise for the query result.
     */
    static delete(id) {
        return this.query(
            `UPDATE activities SET deleted = 1 WHERE id = ?`,
            [id]
        )
    }
}
