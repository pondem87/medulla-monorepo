import { Injectable } from '@nestjs/common';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { Repository } from 'typeorm';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Logger } from 'winston';

@Injectable()
export class CurrencyService {
    private logger: Logger

    constructor(
        @InjectRepository(Currency)
        private readonly currencyRepository: Repository<Currency>,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "currency",
            file: "currency.service"
        })

        this.logger.info("Initializing CurrencyService")
    }

    async create(createCurrencyDto: CreateCurrencyDto): Promise<Currency|null> {
        try {
            return await this.currencyRepository.save(
                this.currencyRepository.create(createCurrencyDto)
            )
        } catch (error) {
            this.logger.error("Failed to create currency", error)
            return null
        }
    }

    findAll() {
        return `This action returns all currency`;
    }

    async findOne(isoCode: string): Promise<Currency | null> {
        try {
            return await this.currencyRepository.findOneBy({ isoCode: isoCode })
        } catch (error) {
            this.logger.error("Failed to retrieve currency", error)
            return null
        }
    }

    update(isoCode: string, updateCurrencyDto: UpdateCurrencyDto) {
        return `This action updates a #${isoCode} currency`;
    }

    remove(id: string) {
        return `This action removes a #${id} currency`;
    }
}
