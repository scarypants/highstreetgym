import { DatabaseModel } from "../models/DatabaseModel.mjs"

/**
 * Model for a post.
 *
 * This model represents a post in the microblog.
 * A post has an id, a subject, content, and a writer id.
 */
export class PostModel extends DatabaseModel {
    /**
     * Create a new PostModel instance.
     *
     * @param {number|null} id - The post id (null if new).
     * @param {string} subject - The post subject.
     * @param {string} content - The post content.
     * @param {number} writerId - The id of the writer.
     */
    constructor(id, subject, content, writerId) {
        super()
        this.id = id
        this.subject = subject
        this.content = content
        this.writerId = writerId
    }

    /**
     * Make a PostModel from a database row.
     *
     * This method takes a row from the posts table and returns
     * a new PostModel with the row's data.
     *
     * @param {Object} row - A row from the posts table.
     * @returns {PostModel} A new PostModel instance.
     */
    static tableToModel(row) {
        return new PostModel(
            row["id"],
            row["subject"],
            row["content"],
            row["writer_id"]
        )
    }

    /**
     * Insert a new post into the database.
     *
     * This method adds a new post to the posts table.
     * It uses the subject, content, and writer id from the post.
     *
     * @param {PostModel} post - The post to create.
     * @returns {Promise} A promise with the query result.
     */
    static create(post) {
        return this.query(`
            INSERT INTO posts
            (subject, content, writer_id)
            VALUES (?, ?, ?)
        `,
            [post.subject, post.content, post.writerId]
        )
    }

    /**
     * Update a post in the database.
     *
     * This method updates the subject and content of a post.
     *
     * @param {PostModel} post - The post with updated data.
     * @returns {Promise} A promise for the query result.
     */
    static update(post) {
        return this.query(`
            UPDATE posts
            SET subject = ?, content = ?
            WHERE id = ?
        `,
            [post.subject, post.content, post.id]
        )
    }

    /**
     * Delete a post from the database.
     *
     * This method deletes a post from the posts table using its id.
     *
     * @param {number} id - The id of the post to delete.
     * @returns {Promise} A promise with the query result.
     */
    static delete(id) {
        return this.query("DELETE FROM posts WHERE id = ?", [id])
    }
}
