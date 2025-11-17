import { z }import {z} from "zod";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.method === "GET" ? req.query : req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    req.validated = result.data;
    next();
  };
}

export const schemas = {
  contact: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    message: z.string().min(5).max(1000)
  }),
  menuCreate: z.object({
    name: z.string().min(2),
    type: z.enum(["Starter","Main","Dessert","Drink"]),
    price: z.number().int().nonnegative(),
    is_active: z.boolean().optional().default(true)
  }),
  orderCreate: z.object({
    customer_name: z.string().min(2).max(100).optional(),
    items: z.array(z.object({
      menu_item_id: z.number().int().positive(),
      quantity: z.number().int().positive()
    })).min(1)
  }),
  reservationCreate: z.object({
    customer_name: z.string().min(2).max(100),
    phone: z.string().min(7).max(20).optional(),
    table_no: z.number().int().positive(),
    reserved_at: z.string().min(10), // ISO datetime
    notes: z.string().max(500).optional()
  })
};
