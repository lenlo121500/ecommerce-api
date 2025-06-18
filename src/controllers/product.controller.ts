import logger from "../utils/logger";
import APIError from "../utils/APIError";
import { Response, Request, NextFunction } from "express";
import {
  createProductService,
  deleteProductService,
  getAllProductsService,
  getSingleProductService,
  updateProductService,
} from "../services/product.service";
import { validateCreateProduct } from "../utils/validation";

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("getAllProducts controller hit...");
  try {
    const { products, total } = await getAllProductsService(req.query);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: {
        products,
        total,
      },
    });
  } catch (error) {
    logger.error(
      `Error in getAllProducts controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const getSingleProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("getSingleProduct controller hit...");
  try {
    const product = await getSingleProductService(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    logger.error(
      `Error in getSingleProduct controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("createProduct controller hit...");
  try {
    const { error } = validateCreateProduct(req.body);
    if (error) {
      throw new APIError(400, error.details[0].message);
    }

    const product = await createProductService(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    logger.error(
      `Error in createProduct controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("updateProduct controller hit...");
  try {
    const updatedProduct = await updateProductService(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        product: updatedProduct,
      },
    });
  } catch (error) {
    logger.error(
      `Error in updateProduct controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("deleteProduct controller hit...");
  try {
    await deleteProductService(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    logger.error(
      `Error in deleteProduct controller: ${(error as Error).message}`
    );
    next(error);
  }
};
