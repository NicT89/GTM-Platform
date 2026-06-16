import { Injectable, NotFoundException } from "@nestjs/common";
import { buildOrganizationProfile } from "@market-intel/domain";

@Injectable()
export class ProfilesService {
  getProfile(organizationId: string) {
    const profile = buildOrganizationProfile(organizationId);

    if (!profile) {
      throw new NotFoundException(`Organization ${organizationId} was not found.`);
    }

    return profile;
  }
}
