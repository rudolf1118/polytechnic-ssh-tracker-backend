import jwt from "jsonwebtoken";
import { jwt_secret } from "../config.js";

const tokenGenerator = async (id, roles) => {
    const payload = { id, roles };
    return await jwt.sign(payload, jwt_secret, { expiresIn: "2h" });
};

export default tokenGenerator;