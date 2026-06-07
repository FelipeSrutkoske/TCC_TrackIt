import { IsEmail, IsOptional } from 'class-validator';

export class SendProofEmailDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}
