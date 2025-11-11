import { Type as T } from 'typebox';

export const idSchema = T.String({
  description: "Entity's id",
});

export const idDtoSchema = T.Object(
  {
    id: idSchema,
  },
  { description: "Entity's id" }
);
