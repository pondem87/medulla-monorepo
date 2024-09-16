import { Type } from "class-transformer";
import { IsString, ValidateNested } from "class-validator";

class Profile {
    @IsString()
    name: string;
}

export class Contact {
    @IsString()
    wa_id: string;

    @ValidateNested()
    @Type(() => Profile)
    profile: Profile;
}