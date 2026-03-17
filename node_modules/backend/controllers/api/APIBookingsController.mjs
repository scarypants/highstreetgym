import express from "express"
import { BookingModel } from "../../models/BookingModel.mjs"
import { BookingSessionDetailsModel } from "../../models/BookingSessionDetailsModel.mjs"
import { DatabaseModel } from "../../models/DatabaseModel.mjs"
import { APIAuthenticationController } from "./APIAuthenticationController.mjs"

export class APIBookingsController {
    static routes = express.Router()

    static {
        this.routes.get("/", APIAuthenticationController.restrict(["member"]), this.getBookingsWithDetails)
        this.routes.get("/xml", APIAuthenticationController.restrict(["member"]), this.getBookingsXML)
        this.routes.post("/", APIAuthenticationController.restrict(["member"]), this.createBooking)
        this.routes.delete("/", APIAuthenticationController.restrict(["member"]), this.deleteBooking)
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/bookings:
     *      get:
     *          summary: "Get the list of all bookings with details"
     *          tags: [Bookings]
     *          security:
     *              - ApiKey: []
     *          responses:
     *              '200':
     *                  description: "Booking list"
     *                  content:
     *                      application/json:
     *                          schema:
     *                              type: array
     *                              items:
     *                                  type: object
     *                                  required:
     *                                      - booking
     *                                      - session
     *                                      - activity
     *                                      - location
     *                                      - user
     *                                  properties:
     *                                      booking:
     *                                          $ref: "#/components/schemas/Booking"
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
    static async getBookingsWithDetails(req, res) {
        try {
            const bookings = await BookingSessionDetailsModel.getByMemberIdWithDetails(req.authenticatedUser.id)

            res.status(200).json(bookings)
        } catch (error) {
            console.error(error)
            res.status(500).json({
                message: "Failed to load bookings from database",
                errors: [error]
            })
        }
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/bookings/xml:
     *      get:
     *          summary: "Export all bookings to XML"
     *          tags: [Bookings]
     *          security:
     *              - ApiKey: []
     *          responses:
     *              '200':
     *                  description: "Bookings XML"
     *                  content:
     *                      text/xml:
     *                          schema:
     *                              type: array
     *                              xml:
     *                                  name: bookings
     *                              items:
     *                                  type: object
     *                                  properties:
     *                                      booking:
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
     *                                                  pattern: '^(0[1-9]|[12]\d|3[01])/(0[1-9]|1[0-2])/\d{4}$'
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
     *                                              trainer:
     *                                                  type: object
     *                                                  properties:
     *                                                      name:
     *                                                          type: string
     *                                                          example: "Trainer Trainer"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async getBookingsXML(req, res) {
        try {
            const date = DatabaseModel.toMySqlDate(new Date())
            const bookings = await BookingSessionDetailsModel.getByMemberIdWithDetails(req.authenticatedUser.id)

            res.status(200).contentType("text/xml").render("xml/bookings.xml.ejs", { bookings, date })
        } catch (error) {
            console.error(error)
            res.status(500).json({
                message: "Failed to export bookings as XML from database",
                errors: [error]
            })        
        }
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/bookings:
     *      post:
     *          summary: "Create a new booking"
     *          tags: [Bookings]
     *          security:
     *              - ApiKey: []
     *          requestBody:
     *              required: true
     *              content:
     *                  application/json:
     *                      schema:
     *                          type: object
     *                          required:
     *                              - sessionId
     *                          properties:
     *                              id:
     *                                type: number
     *                                example: 1
     *                              memberId:
     *                                type: number
     *                                example: 10
     *                              sessionId:
     *                                type: number
     *                                example: 17
     *          responses:
     *              '200':
     *                  $ref: "#/components/responses/Created"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     *              default:
     *                  $ref: "#/components/responses/Error"
     */
    static async createBooking(req, res) {
        try {
            const booking = new BookingModel(
                null,
                req.authenticatedUser.id,
                req.body.sessionId
            )
            
            const result = await BookingModel.create(booking)

            res.status(200).json({
                id: result.insertId,
                message: "Booking created"
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Failed to create booking",
                errors: [error]
            })
        }
    }

    /**
     * 
     * @type {express.RequestHandler}
     * @openapi
     *  /api/bookings:
     *      delete:
     *          summary: "Delete a booking by ID"
     *          tags: [Bookings]
     *          security:
     *              - ApiKey: []
     *          requestBody:
     *              required: true
     *              content:
     *                  application/json:
     *                      schema:
     *                          type: object
     *                          required:
     *                              - bookingId
     *                              - memberId
     *                          properties:
     *                              bookingId:
     *                                  type: number
     *                                  example: 1
     *                              memberId:
     *                                  type: number
     *                                  example: 1
     *          responses:
     *              '200':
     *                  description: "Booking deleted"
     *                  content:
     *                      application/json:
     *                          schema:
     *                              type: object
     *                              properties:
     *                                  message:
     *                                      type: string
     *                                      example: "Booking deleted"
     *              '404':
     *                  $ref: "#/components/responses/NotFound"
     *              '500':
     *                  $ref: "#/components/responses/Error"
     */
    static async deleteBooking(req, res) {
        try {
            const bookingId = req.body.bookingId
            const memberId = req.body.memberId

            if (req.authenticatedUser.role != "admin" && req.authenticatedUser.id != memberId) {
                res.status(404).json({
                    message: "You can only delete own bookings",
                    errors: ["not found", "deleted failed"]
                })
            } else {
                const result = await BookingModel.delete(bookingId)

                if (result.affectedRows == 1) {
                    res.status(200).json({
                        message: "Booking deleted"
                    })
                } else {
                    res.status(404).json({
                        message: "Booking not found - delete failed",
                        errors: ["not found", "deleted failed"]
                    })
                }
            }
        } catch (error) {
            res.status(500).json({
                message: "Failed to delete booking - database error",
                errors: [error]
            })
        }
    }
}