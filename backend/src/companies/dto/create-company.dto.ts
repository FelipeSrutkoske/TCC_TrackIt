import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanySubscriptionStatus } from '../../deliveries/entities/company.entity';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(150)
  corporateName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tradeName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  phone?: string | null;

  @IsOptional()
  @IsEnum(CompanySubscriptionStatus)
  subscriptionStatus?: CompanySubscriptionStatus;
}
