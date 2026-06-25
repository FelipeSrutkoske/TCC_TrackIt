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
  @IsString()
  @MaxLength(30)
  situacaoCnpj?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  cnaePrincipal?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  porte?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  logradouro?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complemento?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bairro?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  municipio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  uf?: string | null;

  @IsOptional()
  @IsEnum(CompanySubscriptionStatus)
  subscriptionStatus?: CompanySubscriptionStatus;
}
