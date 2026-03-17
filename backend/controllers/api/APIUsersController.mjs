import express from "express"
import bcrypt from "bcryptjs"
import { UserModel } from "../../models/UserModel.mjs"
import { APIAuthenticationController } from "./APIAuthenticationController.mjs"

export class APIUsersController {
    static routes = express.Router()

    static {
        this.routes.get("/", APIAuthenticationController.restrict("any"), this.getAuthenticatedUser)
        this.routes.post("/", this.createUser)
        this.routes.patch("/", APIAuthenticationController.restrict(["admin", "trainer", "member"]), this.updateUser)
    }

    /**
     * Handle getting an user by their current authentication key
     * 
     * @type {express.RequestHandler}
     * @openapi
     * /api/users:
     *      get:
     *          summary: "Get user by current authentication key"
     *          tags: [User]
     *          security:
     *              - ApiKey: []
     *          responses:
     *              '200':
     *                  description: "User with provided authentication key"
     *                  content:
     *                      application/json:
     *                          schema:
     *                              $ref: "#/components/schemas/User"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async getAuthenticatedUser(req, res) {
        res.status(200).json(req.authenticatedUser)
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/users:
     *      post:
     *          summary: "Create a new user (Register)"
     *          tags: [User]
     *          requestBody:
     *              required: true
     *              content:
     *                  application/json:
     *                      schema:
     *                          $ref: "#/components/schemas/HandledUser"
     *          responses:
     *              '200':
     *                  $ref: "#/components/responses/Created"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async createUser(req, res) {
        try {
            const user = new UserModel(
                null,
                "member",
                req.body.firstName,
                req.body.lastName,
                req.body.email,
                req.body.password,
                null
            )

            if (!user.password.startsWith("$2a")) {
                user.password = bcrypt.hashSync(user.password)
            }
            
            const result = await UserModel.create(user)

            res.status(200).json({
                id: result.insertId,
                message: "User created"
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Failed to create user",
                errors: [error]
            })
        }
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/users:
     *      patch:
     *          summary: "Update an existing user"
     *          tags: [User]
     *          security:
     *              - ApiKey: []
     *          requestBody:
     *              required: true
     *              content:
     *                  application/json:
     *                      schema:
     *                          $ref: "#/components/schemas/HandledUser"
     *          responses:
     *              '200':
     *                  $ref: "#/components/responses/Updated"
     *              '404':
     *                  $ref: "#/components/responses/NotFound"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     */
    static async updateUser(req, res) {
        try {
            const user = new UserModel(
                req.authenticatedUser.id,
                req.authenticatedUser.role,
                req.body.firstName,
                req.body.lastName,
                req.body.email,
                req.body.password,
                req.body.authenticationKey
            )

            if (typeof user.password === "string" && user.password.trim().length > 0 && !user.password.startsWith("$2a")) {
                user.password = bcrypt.hashSync(user.password)
            } else {
                user.password = req.authenticatedUser.password
            }
            
            const result = await UserModel.update(user)

            if (result.affectedRows == 1) {
                res.status(200).json({
                    message: "User updated"
                })
            } else {
                res.status(404).json({
                    message: "User not found - update failed",
                    errors: ["not found", "updated failed"]
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Failed to update user",
                errors: [error]
            })
        }
    }
}