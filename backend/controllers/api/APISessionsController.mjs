import express from "express"
import { DatabaseModel } from "../../models/DatabaseModel.mjs"
import { SessionModel } from "../../models/SessionModel.mjs"
import { SessionDetailsModel } from "../../models/SessionDetailsModel.mjs"
import { APIAuthenticationController } from "./APIAuthenticationController.mjs"

export class APISessionsController {
    static routes = express.Router()

    static {
        this.routes.get("/", APIAuthenticationController.restrict(["member"]), this.getSessionsWithDetails)
        this.routes.get("/trainer", APIAuthenticationController.restrict(["trainer"]), this.getTrainerSessions)
        this.routes.get("/xml", APIAuthenticationController.restrict(["trainer"]), this.getSessionsXML)
    }

    /**
     * @type {express.RequestHandler}
     * @openapi
     *  /api/sessions:
     *      get:
     *          summary: "Get the list of all sessions with details"
     *          tags: [Sessions]
     *          security:
     *              - ApiKey: []
     *          parameters:
     *                - name: start_date
     *                  in: query
     *                  description: The start date to filter by
     *                  required: true
     *                  schema:
     *                      type: string
     *                      format: date
     *                      example: 2025-05-12
     *                - name: end_date
     *                  in: query
     *                  description: The end date to filter by
     *                  required: true
     *                  schema:
     *                      type: string
     *                      format: date
     *                      example: 2025-05-18
     *          responses:
     *              '200':
     *                  description: "Session list"
     *                  content:
     *                      application/json:
     *                          schema:
     *                              type: array
     *                              items:
     *                                  type: object
     *                                  required:
     *                                      - session
     *                                      - activity
     *                                      - location
     *                                      - user
     *                                  properties:
     *                                      session:
     *                                          $ref: "#/components/schemas/Session"
     *                                      activity:
     *                                          $ref: "#/components/schemas/ActivitySummary"
     *                                      location:
     *                                          $ref: "#/components/schemas/LocationSummary"
     *                                      user:
     *                                          $ref: "#/components/schemas/UserSummary"
     *              '400':
     *                  $ref: "#/components/responses/Error"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async getSessionsWithDetails(req, res) {
        try {
            const sessions = await SessionDetailsModel.getSessionsByDateRange(
                new Date(req.query.start_date), 
                new Date(req.query.end_date)
            )

            res.status(200).json(sessions)
        } catch (error) {
            console.error(error)
            res.status(500).json({
                message: "Failed to load sessions from database"
            })
        }
    }

    /**
     * @type {express.RequestHandler}
     * @openapi
     * /api/sessions/trainer:
     *      get:
     *          summary: "Get specific sessions with details by trainer ID"
     *          tags: [Sessions]
     *          security:
     *              - ApiKey: []
     *          parameters:
     *                - name: start_date
     *                  in: query
     *                  description: The start date to filter by
     *                  required: true
     *                  schema:
     *                      type: string
     *                      format: date
     *                      example: 2025-05-12
     *                - name: end_date
     *                  in: query
     *                  description: The end date to filter by
     *                  required: true
     *                  schema:
     *                      type: string
     *                      format: date
     *                      example: 2025-05-18
     *          responses:
     *              '200':
     *                  description: "Session list"
     *                  content:
     *                      application/json:
     *                          schema:
     *                              type: array
     *                              items:
     *                                  type: object
     *                                  required:
     *                                      - session
     *                                      - activity
     *                                      - location
     *                                      - user
     *                                  properties:
     *                                      session:
     *                                          $ref: "#/components/schemas/Session"
     *                                      activity:
     *                                          type: object
     *                                          required:
     *                                              - name
     *                                          properties:
     *                                              name:
     *                                                  type: string
     *                                                  example: "YOGA"
     *                                      location:
     *                                          type: object
     *                                          required:
     *                                              - name
     *                                          properties:
     *                                              name:
     *                                                  type: string
     *                                                  example: "Ashgrove"
     *                                      user:
     *                                          $ref: "#/components/schemas/UserSummary"
     *              '400':
     *                  $ref: "#/components/responses/Error"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async getTrainerSessions(req, res) {
        try {
            const sessions = await SessionDetailsModel.getAllWithDetailsTrainerByDate(
                req.authenticatedUser.id,
                new Date(req.query.start_date), 
                new Date(req.query.end_date)
            )

            res.status(200).json(sessions)
        } catch (error) {
            console.error(error)
            res.status(500).json({
                message: "Failed to load sessions from database"
            })
        }
    }

    /**
     * @type {express.RequestHandler}
     * @openapi
     *  /api/sessions/xml:
     *      get:
     *          summary: "Export all sessions to XML"
     *          tags: [Sessions]
     *          security:
     *              - ApiKey: []
     *          responses:
     *              '200':
     *                  description: "Sessions XML"
     *                  content:
     *                      text/xml:
     *                          schema:
     *                              type: array
     *                              xml:
     *                                  name: sessions
     *                              items:
     *                                  type: object
     *                                  properties:
     *                                      session:
     *                                          type: object
     *                                          properties:
     *                                              id:
     *                                                  type: string
     *                                                  example: 1
     *                                              activity:
     *                                                  type: object
     *                                                  properties:
     *                                                      name:
     *                                                          type: string
     *                                                          example: "YOGA"
     *                                              date:
     *                                                  type: string
     *                                                  pattern: '^(\d{4}/(0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01]))$'
     *                                                  example: "11/05/2025"
     *                                              time:
     *                                                  type: string
     *                                                  pattern: '^(?:[01]\d|2[0-3]):[0-5]\d$'
     *                                                  example: "08:00"
     *                                              location:
     *                                                  type: object
     *                                                  properties:
     *                                                      name:
     *                                                          type: string
     *                                                          example: "Ashgrove"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async getSessionsXML(req, res) {
        try {
            const today = new Date()
            const startDate = new Date()
            startDate.setDate(today.getDate() - (today.getDay() - 1))
            const endDate = new Date(startDate)
            endDate.setDate(startDate.getDate() + 6)

            const date = DatabaseModel.toMySqlDate(new Date())
            const sessions = await SessionDetailsModel.getAllWithDetailsTrainerByDate(req.authenticatedUser.id, startDate, endDate)

            res.status(200).contentType("text/xml").render("xml/sessions.xml.ejs", { sessions, date })
        } catch (error) {
            console.error(error)
            res.status(500).json({
                message: "Failed to export sessions as XML from database",
                errors: [error]
            })        
        }
    }
}