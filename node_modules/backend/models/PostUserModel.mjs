import { DatabaseModel } from "./DatabaseModel.mjs"
import { UserModel } from "./UserModel.mjs"
import { PostModel } from "./PostModel.mjs"

/**
 * Model for a post with writer info.
 *
 * This model represents a post and its writer.
 * It uses data from the posts table and the users table.
 */
export class PostUserModel extends DatabaseModel {
    /**
     * Create a new PostUserModel instance.
     *
     * @param {PostModel} post - The post data.
     * @param {UserModel} user - The writer data.
     */
    constructor(post, user) {
        super()
        this.post = post
        this.user = user
    }

    /**
     * Make a PostUserModel from a database row.
     *
     * This method takes a row from a query result and returns a new
     * PostUserModel by converting the posts and users parts into
     * PostModel and UserModel objects.
     *
     * @param {Object} row - A row from the query result.
     * @returns {PostUserModel} A new PostUserModel instance.
     */
    static tableToModel(row) {
        return new PostUserModel(
            PostModel.tableToModel(row.posts),
            UserModel.tableToModel(row.users)
        )
    }

    /**
     * Get all posts with writer info.
     *
     * This method runs a SQL query that joins the posts table with the users table.
     * It selects all columns from posts and the id, first_name, and last_name from users.
     * It returns only rows where the user is not deleted.
     * Then it maps each row to a PostUserModel.
     *
     * @returns {Promise<Array<PostUserModel>>} A promise that resolves to an array of PostUserModel.
     */
    static getAllWithWriter() {
        return this.query(`
            SELECT posts.*, users.id, users.first_name, users.last_name 
            FROM posts
            JOIN users ON users.id = posts.writer_id
            WHERE users.deleted = 0
            `)
            .then(result => result.map(row => this.tableToModel(row)))
    }
}
