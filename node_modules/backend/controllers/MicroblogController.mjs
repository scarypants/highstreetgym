import express from "express"
import validator from "validator"
import { PostModel } from "../models/PostModel.mjs"
import { PostUserModel } from "../models/PostUserModel.mjs"
import { AuthenticationController } from "./AuthenticationController.mjs"

/**
 * Microblog controller.
 *
 * This controller handles the display and management of microblog posts.
 * It sets up routes for authenticated users to view, create, and delete posts,
 * as well as for guest users to view posts. It uses PostModel for database operations
 * and PostUserModel to fetch posts with writer details.
 */
export class MicroblogController {
    static routes = express.Router()

    /**
     * Set up routes for the microblog.
     *
     * Registers the following routes:
     * - GET "/" : Authenticated users (admin, trainer, member) can view microblog posts.
     * - GET "/guest" : Guest users can view microblog posts.
     * - POST "/" : Authenticated users can create a new post.
     * - POST "/:id" : Authenticated users can delete a specific post by its id.
     *
     * All authenticated routes require role-based checks using AuthenticationController.restrict.
     */
    static {
        // GET route for authenticated users to view posts.
        this.routes.get("/", AuthenticationController.restrict(["admin", "trainer", "member"]), this.viewPostList)
        // GET route for guest users to view posts.
        this.routes.get("/guest", this.viewPostListForGuest)

        // POST route for authenticated users to create a new post.
        this.routes.post("/", AuthenticationController.restrict(["admin", "trainer", "member"]), this.createPost)
        // POST route for authenticated users to delete a post by id.
        this.routes.post("/:id", AuthenticationController.restrict(["admin", "trainer", "member"]), this.deletePost)
    }

    /**
     * Display the list of microblog posts for authenticated users.
     *
     * This method fetches all posts along with writer details using PostUserModel.getAllWithWriter.
     * Then it renders the "microblog.ejs" view, passing the list of posts and the authenticated user info.
     *
     * @param {express.Request} req - The HTTP request containing authentication data.
     * @param {express.Response} res - The HTTP response used to render the microblog view.
     * @returns {void}
     */
    static viewPostList(req, res) {
        PostUserModel.getAllWithWriter()
            .then(postsWithWriter => {
                res.render("microblog.ejs", { 
                    postsWithWriter,
                    authenticatedUser: req.authenticatedUser
                })
            })
            .catch(error => {
                console.error("Error fetching posts for authenticated user:", error)
                res.status(500).render("status.ejs", {
                    status: "Failed view error",
                    message: "Failed to load the microblog posts.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }

    /**
     * Display the list of microblog posts for guest users.
     *
     * This method fetches all posts with writer details and renders the "microblog.ejs" view.
     * The authenticatedUser parameter is set to "guest" to indicate the viewer is not logged in.
     *
     * @param {express.Request} req - The HTTP request object.
     * @param {express.Response} res - The HTTP response used to render the microblog view.
     * @returns {void}
     */
    static viewPostListForGuest(req, res) {
        PostUserModel.getAllWithWriter()
            .then(postsWithWriter => {
                res.render("microblog.ejs", { 
                    postsWithWriter,
                    authenticatedUser: "guest"
                })
            })
            .catch(error => {
                console.error("Error fetching posts for guest user:", error)
                res.status(500).render("status.ejs", {
                    status: "Failed view error",
                    message: "Failed to load the microblog posts.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }

    /**
     * Create a new microblog post.
     *
     * This method performs the following steps:
     * 1. Retrieves and escapes the subject and content from the request body.
     * 2. Gets the writer's id from the authenticated user object.
     * 3. Validates that both subject and content are provided.
     * 4. Creates a new PostModel instance (with a null id, to be set by the database).
     * 5. Saves the new post to the database.
     * 6. Redirects to the microblog page on success, or renders an error page if creation fails.
     *
     * @param {express.Request} req - The HTTP request containing post data in its body.
     * @param {express.Response} res - The HTTP response used to redirect or render an error view.
     * @returns {void}
     */
    static createPost(req, res) {
        const subject = validator.escape(req.body.subject)
        const content = validator.escape(req.body.content)
        const writerId = req.authenticatedUser.id

        if (!subject || !content) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please enter valid subject or content."
            })
            return
        }

        const post = new PostModel(
            null,
            subject,
            content,
            writerId
        )

        PostModel.create(post)
            .then(result => {
                res.redirect("/microblog")
            })
            .catch(error => {
                console.error("Error creating post:", error)
                res.status(500).render("status.ejs", {
                    status: "Database error",
                    message: "The post could not be created.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }

    /**
     * Delete a microblog post.
     *
     * This method performs the following steps:
     * 1. Retrieves the post id from the URL parameters.
     * 2. Validates that the post id exists and is a valid number.
     * 3. Calls PostModel.delete to remove the post from the database.
     * 4. If deletion is successful (affectedRows > 0), redirects to the microblog page.
     * 5. Otherwise, renders an error page.
     *
     * @param {express.Request} req - The HTTP request containing the post id in its parameters.
     * @param {express.Response} res - The HTTP response used to redirect or render an error view.
     * @returns {void}
     */
    static deletePost(req, res) {
        const selectedPostId = req.params.id

        if (!selectedPostId || !/^[0-9]+$/.test(selectedPostId)) {
            res.status(400).render("status.ejs", {
                status: "Invalid input provided.",
                message: "Please select a valid post."
            })
            return
        }

        PostModel.delete(selectedPostId)
            .then(result => {
                if (result.affectedRows > 0) {
                    res.redirect("/microblog")
                } else {
                    res.status(500).render("status.ejs", {
                        status: "Post update error",
                        message: "The post could be found.",
                        authenticatedUser: req.authenticatedUser
                    })
                }
            })
            .catch(error => {
                console.error("Error deleting post:", error)
                res.status(500).render("status.ejs", {
                    status: "Database error",
                    message: "The post could not be deleted.",
                    authenticatedUser: req.authenticatedUser
                })
            })
    }
}
