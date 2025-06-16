import mongoose from "mongoose";
import Product from "../models/product.model";
import { IProduct } from "../types";
import APIError from "../utils/APIError";

export const getAllProductsService = async (
  query: any
): Promise<{
  products: IProduct[];
  total: number;
}> => {
  const page = parseInt(query.pge) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: any = { isActive: true };

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  const products = await Product.find(filter)
    .populate("seller", "firstName lastName")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments(filter);

  return { products, total };
};

export const getSingleProductService = async (
  id: string
): Promise<IProduct | null> => {
  const product = await Product.findById(id).populate(
    "seller",
    "firstName lastName"
  );

  if (!product) throw new APIError(404, "Product not found");

  return product;
};

export const createProductService = async (
  productData: Partial<IProduct>
): Promise<IProduct> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.create([productData], { session });
    await session.commitTransaction();
    session.endSession();
    return product[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateProductService = async (
  id: string,
  updateData: Partial<IProduct>
): Promise<IProduct | null> => {
  const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return updatedProduct;
};

export const deleteProductService = async (
  id: string
): Promise<IProduct | null> => {
  const deletedProduct = await Product.findByIdAndDelete(id);

  return deletedProduct;
};
