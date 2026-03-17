import express from "express"
import path from "path"
import cors from "cors"
import { MicroblogController } from "./controllers/MicroblogController.mjs"
import { ActivityController } from "./controllers/ActivityController.mjs"
import { LocationController } from "./controllers/LocationController.mjs"
import { UserController } from "./controllers/UserController.mjs"
import { BookingController } from "./controllers/BookingController.mjs"
import { AuthenticationController } from "./controllers/AuthenticationController.mjs"
import { SessionController } from "./controllers/SessionController.mjs"
import { APIController } from "./controllers/api/APIController.mjs"

const app = express()
const port = 8080

// Enable cross-origin resource sharing (CORS) and preflight OPTIONS requests
app.use(cors({
    origin: "http://localhost:5173",
}))

app.set("view engine", "ejs")
app.set("views", path.join(import.meta.dirname, "views"))

// Middleware setup here
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(AuthenticationController.middleware)


// Use routes (from controllers)
app.use("/microblog", MicroblogController.routes)
app.use("/activity", ActivityController.routes)
app.use("/location", LocationController.routes)
app.use("/user", UserController.routes)
app.use("/session", SessionController.routes)
app.use("/booking", BookingController.routes)
app.use("/auth", AuthenticationController.routes)
app.use("/api", APIController.routes)

app.get("/", (req, res) => {
    res.status(301).redirect("/auth")
})

app.use(express.static(path.join(import.meta.dirname, "public")))
app.use(express.static(path.join(import.meta.dirname, "dist")))

app.listen(port, () => {
    console.log("Backend started on http://localhost:" + port)
})