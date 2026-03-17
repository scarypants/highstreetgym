import express from "express"
import { PostUserModel } from "../../models/PostUserModel.mjs"
import { PostModel } from "../../models/PostModel.mjs"
import { APIAuthenticationController } from "./APIAuthenticationController.mjs"

export class APIMicroblogsController {
    static routes = express.Router()

    static {
        this.routes.get("/", this.getPosts)
        this.routes.put("/", APIAuthenticationController.restrict(["admin", "trainer", "member"]), this.createPost)
        this.routes.delete("/", APIAuthenticationController.restrict(["admin", "trainer", "member"]), this.deletePost)
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/posts:
     *      get:
     *          summary: "Get the list of all posts"
     *          tags: [Microblog]
     *          responses:
     *              '200':
     *                  description: "Post list"
     *                  content:
     *                      application/json:
     *                          schema:
     *                              type: array
     *                              items:
     *                                  type: object
     *                                  required:
     *                                      - post
     *                                      - user
     *                                  properties:
     *                                      post:
     *                                          $ref: "#/components/schemas/Post"
     *                                      user:
     *                                          $ref: "#/components/schemas/UserSummary"
     *              '400':
     *                  $ref: "#/components/responses/Error"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async getPosts(req, res) {
        try {
            const posts = await PostUserModel.getAllWithWriter()
            res.status(200).json(posts)
        } catch (error) {
            console.error(error)
            res.status(500).json({
                message: "Failed to load posts from database"
            })
        }
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/posts:
     *      put:
     *          summary: "Create a new post"
     *          tags: [Microblog]
     *          security:
     *              - ApiKey: []
     *          requestBody:
     *              required: true
     *              content:
     *                  application/json:
     *                      schema:
     *                          type: object
     *                          required:
     *                            - subject
     *                            - content
     *                          properties:
     *                            id:
     *                              type: number
     *                              example: 1
     *                            subject:
     *                              type: string
     *                              example: "Morning Yoga Flow"
     *                            content:
     *                              type: string
     *                              example: "Join me for a gentle yoga session tomorrow at 7 AM in Studio B. Perfect way to start your day relaxed and strong!"
     *                            writerId:
     *                              type: number
     *                              example: 8
     *          responses:
     *              '200':
     *                  $ref: "#/components/responses/Put"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async createPost(req, res) {
        try {
            const post = new PostModel(
                req.body.id,
                req.body.subject,
                req.body.content,
                req.authenticatedUser.id
            )

            if (post.id == null) {
                const result = await PostModel.create(post)
                res.status(200).json({
                    id: result.insertId,
                    message: "Post created"
                })
            } else {
                const result = await PostModel.update(post)
                if (result.affectedRows == 1) {
                    res.status(200).json({
                        message: "Post updated"
                    })
                } else {
                    res.status(404).json({
                        message: "Post not found - update failed",
                        errors: ["not found", "updated failed"]
                    })
                }
            }
            
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Failed to create (update) post",
                errors: [error]
            })
        }
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/posts:
     *      delete:
     *          summary: "Delete a post by ID"
     *          tags: [Microblog]
     *          security:
     *              - ApiKey: []
     *          requestBody:
     *              required: true
     *              content:
     *                  application/json:
     *                      schema:
     *                          type: object
     *                          required:
     *                              - postId
     *                              - writerId
     *                          properties:
     *                              postId:
     *                                  type: number
     *                                  example: 1
     *                              writerId:
     *                                  type: number
     *                                  example: 1
     *          responses:
     *              '200':
     *                  description: "Post deleted"
     *                  content:
     *                      application/json:
     *                          schema:
     *                              type: object
     *                              properties:
     *                                  message:
     *                                      type: string
     *                                      example: "Post deleted"
     *              '404':
     *                  $ref: "#/components/responses/NotFound"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     */
    static async deletePost(req, res) {
        try {
            const postId = req.body.postId
            const writerId = req.body.writerId

            if (req.authenticatedUser.role != "admin" && req.authenticatedUser.id != writerId) {
                res.status(404).json({
                    message: "You can only delete own posts",
                    errors: ["not found", "deleted failed"]
                })
            } else {
                const result = await PostModel.delete(postId)

                if (result.affectedRows == 1) {
                    res.status(200).json({
                        message: "Post deleted"
                    })
                } else {
                    res.status(404).json({
                        message: "Post not found - delete failed",
                        errors: ["not found", "deleted failed"]
                    })
                }
            }
            
        } catch (error) {
            res.status(500).json({
                message: "Failed to delete post - database error",
                errors: [error]
            })
        }
    }
}