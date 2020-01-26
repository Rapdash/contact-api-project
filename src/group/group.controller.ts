import * as express from "express";
import Router from "express-promise-router";
import { ForbiddenException } from "../exceptions/forbidden.exception";
import { Controller } from "../interfaces/controller.interface";
import { RequestWithUser } from "../interfaces/requestWithUser.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { GroupService } from "./group.service";
import { ContactService } from "../contact/contact.service";
import { CreateGroupDto } from "./createGroup.dto";

export class GroupController implements Controller {
  public path = "/group";
  public router = Router();
  private groupService = new GroupService();
  private contactService = new ContactService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/`,
      authMiddleware,
      validationMiddleware(CreateGroupDto),
      this.addGroup
    );
    this.router.get(`${this.path}/`, authMiddleware, this.getOwnedGroups);
    this.router.get(`${this.path}/:id/`, authMiddleware, this.getOneGroup);
  }

  private addGroup = async (
    req: RequestWithUser,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const createdGroup = await this.groupService.createGroup(
        req.body,
        req.user.id
      );
      res.status(201).json(createdGroup.rows[0]);
    } catch (error) {
      next(error);
    }
  };

  private getOwnedGroups = async (
    req: RequestWithUser,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const returnedGroups = await this.groupService.findOwnedGroups(
        req.user.id
      );
      res.status(200).json(returnedGroups.rows);
    } catch (error) {
      next(error);
    }
  };

  private getOneGroup = async (
    req: RequestWithUser,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const returnedGroupData = await this.groupService.findOneGroup(
        Number(req.params["id"])
      );

      let returnedContactData; // Sets this in a wider scope so I can bundle them for the response

      if (returnedGroupData.rows[0].owner_id === req.user.id) {
        returnedContactData = await this.contactService.findContactsByGroup(
          Number(req.params["id"])
        );
        res.status(200).json({ ...returnedGroupData.rows[0], contacts: returnedContactData.rows });
      } else {
        throw new ForbiddenException()
      }
    } catch (error) {
      next(error);
    }
  }
}
