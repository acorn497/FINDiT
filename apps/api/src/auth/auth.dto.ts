import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CheckEmailDto {
  @IsEmail({}, { message: '이메일 형식이 아닙니다' })
  @MaxLength(120)
  email: string;
}

export class LoginDto extends CheckEmailDto {
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해 주세요' })
  @MaxLength(100)
  password: string;
}
