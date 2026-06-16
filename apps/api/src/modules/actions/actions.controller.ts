import { Controller, Get } from "@nestjs/common";
import { ActionsService } from "./actions.service";

@Controller("actions")
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get("recommendations")
  getRecommendations() {
    return this.actionsService.getRecommendations();
  }
}
