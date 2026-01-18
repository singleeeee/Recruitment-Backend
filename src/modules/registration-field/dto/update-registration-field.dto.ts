import { PartialType } from '@nestjs/mapped-types';
import { CreateRegistrationFieldDto } from './create-registration-field.dto';

export class UpdateRegistrationFieldDto extends PartialType(CreateRegistrationFieldDto) {}
