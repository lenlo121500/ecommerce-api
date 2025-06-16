import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from "../controllers/product.controller";
import { authorize, protect } from "../middlewares/auth.middleware";

const productRoutes = Router();

productRoutes.get("/", getAllProducts);
productRoutes.get("/:id", getSingleProduct);
productRoutes.post("/", protect, authorize("seller", "admin"), createProduct);
productRoutes.put("/:id", protect, authorize("seller", "admin"), updateProduct);
productRoutes.delete(
  "/:id",
  protect,
  authorize("seller", "admin"),
  deleteProduct
);

export default productRoutes;
