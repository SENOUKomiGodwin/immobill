import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token!: string;

  @ApiProperty({ example: 'refresh-token-value', required: false })
  refresh_token?: string;

  @ApiProperty({
    example: {
      id: 'user-id',
      email: 'user@example.com',
      full_name: 'John Doe',
      role: 'user',
    },
  })
  user!: {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'user';
  };
}
