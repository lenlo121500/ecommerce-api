import Joi from "joi";

export const validateRegister = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid("user", "admin", "seller").default("customer"),
    addresses: Joi.array().items(
      Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required(),
        isDefault: Joi.boolean().default(false),
      })
    ),
  });

  return schema.validate(data);
};

export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};

export const validateCreateProduct = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(),
    category: Joi.string().required(),
    stock: Joi.number().required(),
    images: Joi.array().items(Joi.string()).required(),
    seller: Joi.string().required(),
  });

  return schema.validate(data);
};