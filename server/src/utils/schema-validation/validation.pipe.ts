import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ObjectSchema } from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(
    private schema: ObjectSchema,
    private property: 'body' | 'params' | 'query' = 'body',
  ) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // Validate only the specified request property
    if (metadata.type !== this.property) return value;

    const { error, value: validatedValue } = this.schema.validate(value, {
      abortEarly: false, // Show all validation errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      throw new BadRequestException(
        error.details.map((err) => err.message).join(', '),
      );
    }

    return validatedValue;
  }
}
