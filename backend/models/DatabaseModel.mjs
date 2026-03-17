import mysql from "mysql2/promise"

/**
 * DatabaseModel class.
 *
 * This class helps to run database queries.
 * It uses a MySQL connection pool.
 * It also has helper methods to convert dates and times
 * between JavaScript and MySQL formats.
 */
export class DatabaseModel extends Object {
    static connection

    // Set up the database connection with a connection pool.
    static {
        this.connection = mysql.createPool({
            host: "localhost",
            user: "high-street-gym-user",
            password: "highstreetgym",
            database: "high-street-gym",
            nestTables: true,
        })
    }

    /**
     * Run a SQL query on the database.
     *
     * This method uses the connection pool to run a query.
     * It returns a promise that resolves with the result.
     *
     * @param {string} sql - The SQL query.
     * @param {Array<any>} values - An array of values for the query.
     * @returns {Promise<any>} A promise with the query result.
     */
    static query(sql, values) {
        return this.connection.query(sql, values)
            .then(([result]) => result)
    }

    /**
     * Convert a JavaScript Date to a MySQL date string.
     *
     * This method formats a Date into a string like "YYYY-MM-DD".
     * If no date is given, it returns an empty string.
     *
     * @param {Date} date - A JavaScript Date.
     * @returns {string} A date string in "YYYY-MM-DD" format.
     */
    static toMySqlDate(date) {
        if (!date) {
            return ""
        }

        const year = date.toLocaleString("default", { year: "numeric" })
        const month = date.toLocaleString("default", { month: "2-digit" })
        const day = date.toLocaleString("default", { day: "2-digit" })

        return [year, month, day].join("-")
    }

    /**
     * Convert a MySQL date to a JavaScript date string.
     *
     * This method converts a date to a string like "DD/MM/YYYY".
     * If no date is given, it returns an empty string.
     *
     * @param {Date|string} date - A Date or date string.
     * @returns {string} A date string in "DD/MM/YYYY" format.
     */
    static toJSDate(date) {
        if (!date) {
            return ""
        }

        const year = date.toLocaleString("default", { year: "numeric" })
        const month = date.toLocaleString("default", { month: "2-digit" })
        const day = date.toLocaleString("default", { day: "2-digit" })

        return [day, month, year].join("/")
    }

    /**
     * Convert a time string to a MySQL time string.
     *
     * This method takes a time string in "HH:MM" format and
     * returns a string in "HH:MM:SS" format by adding seconds.
     * If no time is given, it returns an empty string.
     *
     * @param {string} time - A time string in "HH:MM" format.
     * @returns {string} A time string in "HH:MM:SS" format.
     */
    static toMySqlTime(time) {
        if (!time) {
            return ""
        }

        const seconds = "00"

        return [time, seconds].join(":")
    }

    /**
     * Convert a MySQL time string to a JavaScript time string.
     *
     * This method takes a time string in "HH:MM:SS" format and
     * returns a string in "HH:MM" format by removing the seconds.
     * If no time is given, it returns an empty string.
     *
     * @param {string} time - A time string in "HH:MM:SS" format.
     * @returns {string} A time string in "HH:MM" format.
     */
    static toJSTime(time) {
        if (!time) {
            return ""
        }

        const JSTime = time.split(":")

        return [JSTime[0], JSTime[1]].join(":")
    }
}
