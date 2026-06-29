import logger from "../../common/utils/logger.js";
import type { Request, Response } from "express";

export const GetHelath = async (req: Request, resp: Response) => {
  resp.status(200).json({ status: "success", message: "Server is healthy" });
};
