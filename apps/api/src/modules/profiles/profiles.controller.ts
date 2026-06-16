import { Controller, Get, Param } from "@nestjs/common";
import { ProfilesService } from "./profiles.service";

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(":organizationId")
  getProfile(@Param("organizationId") organizationId: string) {
    return this.profilesService.getProfile(organizationId);
  }
}
