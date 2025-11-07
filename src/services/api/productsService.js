import { getApperClient } from '@/services/apperClient';
import { toast } from 'react-toastify';

class ProductsService {
  constructor() {
    this.apperClient = null;
    this.initializeClient();
  }

  initializeClient() {
    this.apperClient = getApperClient();
  }

  async getAll(filters = {}) {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      let whereConditions = [];
      let orderBy = [];

      // Apply category filter
      if (filters.category) {
        whereConditions.push({
          FieldName: "category_c",
          Operator: "EqualTo",
          Values: [filters.category],
          Include: true
        });
      }

      // Apply search filter
      if (filters.search) {
        whereConditions.push({
          FieldName: "name_c",
          Operator: "Contains",
          Values: [filters.search],
          Include: true
        });
      }

      // Apply price range filter
      if (filters.minPrice !== undefined) {
        whereConditions.push({
          FieldName: "price_c",
          Operator: "GreaterThanOrEqualTo",
          Values: [filters.minPrice.toString()],
          Include: true
        });
      }
      if (filters.maxPrice !== undefined) {
        whereConditions.push({
          FieldName: "price_c",
          Operator: "LessThanOrEqualTo",
          Values: [filters.maxPrice.toString()],
          Include: true
        });
      }

      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case "price-low":
            orderBy.push({ fieldName: "price_c", sorttype: "ASC" });
            break;
          case "price-high":
            orderBy.push({ fieldName: "price_c", sorttype: "DESC" });
            break;
          case "name":
            orderBy.push({ fieldName: "name_c", sorttype: "ASC" });
            break;
        }
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "price_c"}},
          {"field": {"Name": "category_c"}},
          {"field": {"Name": "subcategory_c"}},
          {"field": {"Name": "images_c"}},
          {"field": {"Name": "sizes_c"}},
          {"field": {"Name": "colors_c"}},
          {"field": {"Name": "stock_c"}},
          {"field": {"Name": "featured_c"}}
        ],
        where: whereConditions,
        orderBy: orderBy.length > 0 ? orderBy : [{ fieldName: "Id", sorttype: "DESC" }],
        pagingInfo: {
          limit: 50,
          offset: 0
        }
      };

      const response = await this.apperClient.fetchRecords('product_c', params);

      if (!response.success) {
        console.error("Error fetching products:", response.message);
        toast.error(response.message);
        return { success: false, data: [] };
      }

      // Transform data to match UI expectations
      const transformedData = response.data?.map(product => ({
        Id: product.Id,
        name: product.name_c || '',
        description: product.description_c || '',
        price: parseFloat(product.price_c) || 0,
        category: product.category_c || '',
        subcategory: product.subcategory_c || '',
        images: product.images_c ? product.images_c.split('\n') : [],
        sizes: product.sizes_c ? product.sizes_c.split(',') : [],
        colors: product.colors_c ? product.colors_c.split(',') : [],
        stock: parseInt(product.stock_c) || 0,
        featured: product.featured_c === true || product.featured_c === 'true'
      })) || [];

      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      console.error("Error fetching products:", error?.response?.data?.message || error);
      return { success: false, data: [] };
    }
  }

  async getById(id) {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "price_c"}},
          {"field": {"Name": "category_c"}},
          {"field": {"Name": "subcategory_c"}},
          {"field": {"Name": "images_c"}},
          {"field": {"Name": "sizes_c"}},
          {"field": {"Name": "colors_c"}},
          {"field": {"Name": "stock_c"}},
          {"field": {"Name": "featured_c"}}
        ]
      };

      const response = await this.apperClient.getRecordById('product_c', parseInt(id), params);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: "Product not found"
        };
      }

      // Transform data to match UI expectations
      const product = response.data;
      const transformedData = {
        Id: product.Id,
        name: product.name_c || '',
        description: product.description_c || '',
        price: parseFloat(product.price_c) || 0,
        category: product.category_c || '',
        subcategory: product.subcategory_c || '',
        images: product.images_c ? product.images_c.split('\n') : [],
        sizes: product.sizes_c ? product.sizes_c.split(',') : [],
        colors: product.colors_c ? product.colors_c.split(',') : [],
        stock: parseInt(product.stock_c) || 0,
        featured: product.featured_c === true || product.featured_c === 'true'
      };

      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      console.error("Error fetching product:", error?.response?.data?.message || error);
      return {
        success: false,
        error: "Product not found"
      };
    }
  }

  async getFeatured() {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "price_c"}},
          {"field": {"Name": "category_c"}},
          {"field": {"Name": "subcategory_c"}},
          {"field": {"Name": "images_c"}},
          {"field": {"Name": "sizes_c"}},
          {"field": {"Name": "colors_c"}},
          {"field": {"Name": "stock_c"}},
          {"field": {"Name": "featured_c"}}
        ],
        where: [{
          FieldName: "featured_c",
          Operator: "EqualTo",
          Values: ["true"],
          Include: true
        }],
        orderBy: [{ fieldName: "Id", sorttype: "DESC" }],
        pagingInfo: {
          limit: 8,
          offset: 0
        }
      };

      const response = await this.apperClient.fetchRecords('product_c', params);

      if (!response.success) {
        console.error("Error fetching featured products:", response.message);
        return { success: false, data: [] };
      }

      // Transform data to match UI expectations
      const transformedData = response.data?.map(product => ({
        Id: product.Id,
        name: product.name_c || '',
        description: product.description_c || '',
        price: parseFloat(product.price_c) || 0,
        category: product.category_c || '',
        subcategory: product.subcategory_c || '',
        images: product.images_c ? product.images_c.split('\n') : [],
        sizes: product.sizes_c ? product.sizes_c.split(',') : [],
        colors: product.colors_c ? product.colors_c.split(',') : [],
        stock: parseInt(product.stock_c) || 0,
        featured: product.featured_c === true || product.featured_c === 'true'
      })) || [];

      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      console.error("Error fetching featured products:", error?.response?.data?.message || error);
      return { success: false, data: [] };
    }
  }

  async getRelated(productId, limit = 4) {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      // First get the product to find its category
      const productResult = await this.getById(productId);
      if (!productResult.success) {
        return { success: false, error: "Product not found" };
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "price_c"}},
          {"field": {"Name": "category_c"}},
          {"field": {"Name": "subcategory_c"}},
          {"field": {"Name": "images_c"}},
          {"field": {"Name": "sizes_c"}},
          {"field": {"Name": "colors_c"}},
          {"field": {"Name": "stock_c"}},
          {"field": {"Name": "featured_c"}}
        ],
        where: [
          {
            FieldName: "category_c",
            Operator: "EqualTo",
            Values: [productResult.data.category],
            Include: true
          },
          {
            FieldName: "Id",
            Operator: "NotEqualTo",
            Values: [parseInt(productId).toString()],
            Include: true
          }
        ],
        orderBy: [{ fieldName: "Id", sorttype: "DESC" }],
        pagingInfo: {
          limit: limit,
          offset: 0
        }
      };

      const response = await this.apperClient.fetchRecords('product_c', params);

      if (!response.success) {
        console.error("Error fetching related products:", response.message);
        return { success: false, data: [] };
      }

      // Transform data to match UI expectations
      const transformedData = response.data?.map(product => ({
        Id: product.Id,
        name: product.name_c || '',
        description: product.description_c || '',
        price: parseFloat(product.price_c) || 0,
        category: product.category_c || '',
        subcategory: product.subcategory_c || '',
        images: product.images_c ? product.images_c.split('\n') : [],
        sizes: product.sizes_c ? product.sizes_c.split(',') : [],
        colors: product.colors_c ? product.colors_c.split(',') : [],
        stock: parseInt(product.stock_c) || 0,
        featured: product.featured_c === true || product.featured_c === 'true'
      })) || [];

      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      console.error("Error fetching related products:", error?.response?.data?.message || error);
      return { success: false, data: [] };
    }
  }

  async getCategories() {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      const params = {
        fields: [
          {"field": {"Name": "category_c"}},
        ],
        groupBy: ["category_c"],
        orderBy: [{ fieldName: "category_c", sorttype: "ASC" }],
        pagingInfo: {
          limit: 50,
          offset: 0
        }
      };

      const response = await this.apperClient.fetchRecords('product_c', params);

      if (!response.success) {
        console.error("Error fetching categories:", response.message);
        return { success: false, data: [] };
      }
// Extract unique categories
      const categories = [...new Set(response.data?.map(item => item.category_c).filter(Boolean))];

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error("Error fetching categories:", error?.response?.data?.message || error);
      return { success: false, data: [] };
    }
  }
}
export default new ProductsService();