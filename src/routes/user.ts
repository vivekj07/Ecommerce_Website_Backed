import express from "express"
import { deleteUser, getAllUsers, getSingleUser, newUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post("/new", newUser);
app.get("/all", adminOnly, getAllUsers);
// app.delete("/:id", deleteUser);
// app.get("/:id", getSingleUser);
app.route("/:id").get(getSingleUser).delete(adminOnly, deleteUser);
export default app;