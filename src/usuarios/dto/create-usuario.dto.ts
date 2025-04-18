import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  // Eliminamos el campo password

  @IsOptional()
  @IsString()
  @IsIn(['usuario', 'admin'])
  rol?: string = 'usuario';

  @IsOptional()
  @IsString()
  auth0_id?: string; // Añadimos el campo para el ID de Auth0
}
