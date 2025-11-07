import { getApperClient } from '@/services/apperClient';
import { toast } from 'react-toastify';

class CategoryService {
  constructor() {
    this.apperClient = null;
    this.initializeClient();
  }

  initializeClient() {
    this.apperClient = getApperClient();
  }

  async getAll() {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "subcategories_c"}}
        ],
        orderBy: [{ fieldName: "name_c", sorttype: "ASC" }],
        pagingInfo: {
          limit: 50,
          offset: 0
        }
      };

      const response = await this.apperClient.fetchRecords('category_c', params);

      if (!response.success) {
        console.error("Error fetching categories:", response.message);
        toast.error(response.message);
        return { success: false, data: [] };
      }

      // Transform data to match UI expectations
      const transformedData = response.data?.map(category => ({
        Id: category.Id,
        name: category.name_c || '',
        subcategories: category.subcategories_c ? JSON.parse(category.subcategories_c) : []
      })) || [];

      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      console.error("Error fetching categories:", error?.response?.data?.message || error);
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
          {"field": {"Name": "subcategories_c"}}
        ]
      };

      const response = await this.apperClient.getRecordById('category_c', parseInt(id), params);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: "Category not found"
        };
      }

      // Transform data to match UI expectations
      const category = response.data;
      const transformedData = {
        Id: category.Id,
        name: category.name_c || '',
        subcategories: category.subcategories_c ? JSON.parse(category.subcategories_c) : []
      };

      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      console.error("Error fetching category:", error?.response?.data?.message || error);
      return {
        success: false,
        error: "Category not found"
      };
    }
  }

  async create(categoryData) {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      const categoryRecord = {
        name_c: categoryData.name || '',
        subcategories_c: JSON.stringify(categoryData.subcategories || [])
      };

      const params = {
        records: [categoryRecord]
      };

      const response = await this.apperClient.createRecord('category_c', params);

      if (!response.success) {
        console.error("Error creating category:", response.message);
        toast.error(response.message);
        return { success: false, error: response.message };
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} categories:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
          return { success: false, error: "Failed to create category" };
        }

        return {
          success: true,
          data: successful[0]?.data
        };
      }

      return { success: false, error: "Failed to create category" };
    } catch (error) {
      console.error("Error creating category:", error?.response?.data?.message || error);
      return { success: false, error: "Failed to create category" };
    }
  }
}

export default new CategoryService();