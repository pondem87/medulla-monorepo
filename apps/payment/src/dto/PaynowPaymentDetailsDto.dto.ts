import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class PaynowPaymentDetailsDto {
    @IsString()
    userId: string;
    @IsString()
    product: string;
    @IsString()
    method: string;
    @IsNumber()
    amount: number;
    @IsString()
    mobile: string
    @IsOptional()
    @IsEmail()
    email?: string
}