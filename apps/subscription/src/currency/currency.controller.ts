import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Controller()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  create(createCurrencyDto: CreateCurrencyDto) {
    return this.currencyService.create(createCurrencyDto);
  }

  findAll() {
    return this.currencyService.findAll();
  }

  findOne(isoCode: string) {
    return this.currencyService.findOne(isoCode);
  }

  update(isoCode: string, updateCurrencyDto: UpdateCurrencyDto) {
    return this.currencyService.update(isoCode, updateCurrencyDto);
  }

  @MessagePattern('removeCurrency')
  remove(@Payload() isoCode: string) {
    return this.currencyService.remove(isoCode);
  }
}
