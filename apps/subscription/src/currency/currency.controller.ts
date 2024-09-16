import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Controller()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @MessagePattern('createCurrency')
  create(@Payload() createCurrencyDto: CreateCurrencyDto) {
    return this.currencyService.create(createCurrencyDto);
  }

  @MessagePattern('findAllCurrency')
  findAll() {
    return this.currencyService.findAll();
  }

  @MessagePattern('findOneCurrency')
  findOne(@Payload() id: number) {
    return this.currencyService.findOne(id);
  }

  @MessagePattern('updateCurrency')
  update(@Payload() updateCurrencyDto: UpdateCurrencyDto) {
    return this.currencyService.update(updateCurrencyDto.id, updateCurrencyDto);
  }

  @MessagePattern('removeCurrency')
  remove(@Payload() id: number) {
    return this.currencyService.remove(id);
  }
}
