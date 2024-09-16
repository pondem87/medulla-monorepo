import { PartialType } from '@nestjs/mapped-types';
import { CreateWhatsappMessengerDto } from './create-whatsapp-messenger.dto';

export class UpdateWhatsappMessengerDto extends PartialType(CreateWhatsappMessengerDto) {
  id: number;
}
