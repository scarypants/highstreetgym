import { DatabaseModel } from "./DatabaseModel.mjs"

/**
 * Model for a location.
 *
 * This model represents a location with a name and an address.
 * It extends DatabaseModel so that it can run database queries.
 */
export class LocationModel extends DatabaseModel {
    /**
     * Create a new LocationModel instance.
     *
     * @param {number|null} id - The location id (null if new).
     * @param {string} name - The location name.
     * @param {string} address - The location address.
     */
    constructor(id, name, address) {
        super()
        this.id = id
        this.name = name
        this.address = address
    }

    /**
     * Make a LocationModel from a database row.
     *
     * This function takes a row from the database and returns a new
     * LocationModel with values from the row.
     *
     * @param {Object} row - A row from the locations table.
     * @returns {LocationModel} A new LocationModel instance.
     */
    static tableToModel(row) {
        return new LocationModel(
            row["id"],
            row["name"],
            row["address"]
        )
    }

    /**
     * Insert a new location into the database.
     *
     * This method adds a new location into the locations table.
     * It uses the name and address from the location object.
     *
     * @param {LocationModel} location - The location to create.
     * @returns {Promise} A promise with the query result.
     */
    static create(location) {
        return this.query(`
            INSERT INTO locations
            (name, address)
            VALUES (?, ?)
        `,
            [location.name, location.address]
        )
    }

    /**
     * Get all locations that are not deleted.
     *
     * This method selects all rows from the locations table
     * where deleted is 0. It maps each row to a LocationModel.
     *
     * @returns {Promise<Array<LocationModel>>} A promise that resolves to an array of LocationModel.
     */
    static getAll() {
        return this.query("SELECT * FROM locations WHERE deleted = 0")
            .then(result => result.map(row => this.tableToModel(row.locations)))
    }

    /**
     * Update a location in the database.
     *
     * This method updates a location's name and address.
     * It uses the location id to know which row to update.
     *
     * @param {LocationModel} location - The location with new data.
     * @returns {Promise} A promise with the query result.
     */
    static update(location) {
        return this.query(`
            UPDATE locations
            SET name = ?, address = ?
            WHERE id = ?
        `,
            [location.name, location.address, location.id]
        )
    }

    /**
     * Mark a location as deleted.
     *
     * This method sets the deleted flag to 1 for the given location id.
     *
     * @param {number} id - The id of the location to delete.
     * @returns {Promise} A promise with the query result.
     */
    static delete(id) {
        return this.query(
            "UPDATE locations SET deleted = 1 WHERE id = ?",
            [id]
        )
    }
}
