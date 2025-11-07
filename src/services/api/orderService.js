import { getApperClient } from '@/services/apperClient';
import { toast } from 'react-toastify';

class OrderService {
  constructor() {
    this.apperClient = null;
    this.initializeClient();
  }

  initializeClient() {
    this.apperClient = getApperClient();
  }

  async createOrder(orderData) {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      const orderNumber = `VT${Date.now().toString().slice(-6)}`;
      
      const orderRecord = {
        order_number_c: orderNumber,
        order_date_c: new Date().toISOString(),
        status_c: "confirmed",
        total_c: orderData.totalAmount || 0,
        items_c: JSON.stringify(orderData.items || []),
        shipping_address_c: JSON.stringify(orderData.shippingAddress || {}),
        tracking_c: JSON.stringify({
          carrier: "FedEx",
          trackingNumber: `TRK${Date.now().toString().slice(-8)}`,
          events: [
            { date: new Date().toISOString(), status: "Order placed", location: "Online" }
          ]
        })
      };

      const params = {
        records: [orderRecord]
      };

      const response = await this.apperClient.createRecord('order_c', params);

      if (!response.success) {
        console.error("Error creating order:", response.message);
        toast.error(response.message);
        return { success: false, error: response.message };
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} orders:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
          return { success: false, error: "Failed to create order" };
        }

        // Transform data for UI
        const createdOrder = successful[0]?.data;
        if (createdOrder) {
          const transformedOrder = {
            Id: createdOrder.Id,
            orderNumber: createdOrder.order_number_c,
            orderDate: createdOrder.order_date_c,
            status: createdOrder.status_c,
            total: parseFloat(createdOrder.total_c) || 0,
            totalAmount: parseFloat(createdOrder.total_c) || 0,
            items: createdOrder.items_c ? JSON.parse(createdOrder.items_c) : [],
            shippingAddress: createdOrder.shipping_address_c ? JSON.parse(createdOrder.shipping_address_c) : {},
            tracking: createdOrder.tracking_c ? JSON.parse(createdOrder.tracking_c) : {}
          };

          return {
            success: true,
            data: transformedOrder
          };
        }
      }

      return { success: false, error: "Failed to create order" };
    } catch (error) {
      console.error("Error creating order:", error?.response?.data?.message || error);
      return { success: false, error: "Failed to create order" };
    }
  }

  async getOrderById(id) {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "order_number_c"}},
          {"field": {"Name": "order_date_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "total_c"}},
          {"field": {"Name": "items_c"}},
          {"field": {"Name": "shipping_address_c"}},
          {"field": {"Name": "tracking_c"}}
        ]
      };

      const response = await this.apperClient.getRecordById('order_c', parseInt(id), params);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: "Order not found"
        };
      }

      // Transform data for UI
      const order = response.data;
      const transformedOrder = {
        Id: order.Id,
        orderNumber: order.order_number_c || '',
        orderDate: order.order_date_c || '',
        status: order.status_c || '',
        total: parseFloat(order.total_c) || 0,
        items: order.items_c ? JSON.parse(order.items_c) : [],
        shippingAddress: order.shipping_address_c ? JSON.parse(order.shipping_address_c) : {},
        tracking: order.tracking_c ? JSON.parse(order.tracking_c) : {}
      };

      return {
        success: true,
        data: transformedOrder
      };
    } catch (error) {
      console.error("Error fetching order:", error?.response?.data?.message || error);
      return {
        success: false,
        error: "Order not found"
      };
    }
  }

  async getUserOrders(filters = {}) {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      let whereConditions = [];

      // Filter by status
      if (filters.status && filters.status !== 'all') {
        whereConditions.push({
          FieldName: "status_c",
          Operator: "EqualTo",
          Values: [filters.status],
          Include: true
        });
      }

      // Filter by search query (order number)
      if (filters.search) {
        whereConditions.push({
          FieldName: "order_number_c",
          Operator: "Contains",
          Values: [filters.search],
          Include: true
        });
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "order_number_c"}},
          {"field": {"Name": "order_date_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "total_c"}},
          {"field": {"Name": "items_c"}},
          {"field": {"Name": "shipping_address_c"}},
          {"field": {"Name": "tracking_c"}}
        ],
        where: whereConditions,
        orderBy: [{ fieldName: "order_date_c", sorttype: "DESC" }],
        pagingInfo: {
          limit: 50,
          offset: 0
        }
      };

      const response = await this.apperClient.fetchRecords('order_c', params);

      if (!response.success) {
        console.error("Error fetching user orders:", response.message);
        return { success: false, data: [] };
      }

      // Transform data for UI
      const transformedOrders = response.data?.map(order => ({
        Id: order.Id,
        orderNumber: order.order_number_c || '',
        orderDate: order.order_date_c || '',
        status: order.status_c || '',
        total: parseFloat(order.total_c) || 0,
        items: order.items_c ? JSON.parse(order.items_c) : [],
        shippingAddress: order.shipping_address_c ? JSON.parse(order.shipping_address_c) : {},
        tracking: order.tracking_c ? JSON.parse(order.tracking_c) : {}
      })) || [];

      return {
        success: true,
        data: transformedOrders
      };
    } catch (error) {
      console.error("Error fetching user orders:", error?.response?.data?.message || error);
      return { success: false, data: [] };
    }
  }

  async getOrderTracking(orderId) {
    try {
      const orderResult = await this.getOrderById(orderId);
      
      if (!orderResult.success) {
        return {
          success: false,
          error: "Order not found"
        };
      }
      
      return {
        success: true,
        data: orderResult.data.tracking || {}
      };
    } catch (error) {
      console.error("Error fetching order tracking:", error?.response?.data?.message || error);
      return {
        success: false,
        error: "Order not found"
      };
    }
  }

  async updateOrderStatus(orderId, newStatus) {
    try {
      if (!this.apperClient) {
        this.initializeClient();
      }

      // First get the current order
      const currentOrderResult = await this.getOrderById(orderId);
      if (!currentOrderResult.success) {
        return {
          success: false,
          error: "Order not found"
        };
      }

      const currentOrder = currentOrderResult.data;
      
      // Update tracking with new event
      const updatedTracking = { ...currentOrder.tracking };
      if (!updatedTracking.events) {
        updatedTracking.events = [];
      }
      
      updatedTracking.events.push({
        date: new Date().toISOString(),
        status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
        location: "Warehouse"
      });

      const updateRecord = {
        Id: parseInt(orderId),
        status_c: newStatus,
        tracking_c: JSON.stringify(updatedTracking)
      };

      const params = {
        records: [updateRecord]
      };

      const response = await this.apperClient.updateRecord('order_c', params);

      if (!response.success) {
        console.error("Error updating order status:", response.message);
        toast.error(response.message);
        return { success: false, error: response.message };
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} orders:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
          return { success: false, error: "Failed to update order status" };
        }

        return {
          success: true,
          data: successful[0]?.data || currentOrder
        };
      }

      return { success: false, error: "Failed to update order status" };
    } catch (error) {
      console.error("Error updating order status:", error?.response?.data?.message || error);
      return { success: false, error: "Failed to update order status" };
    }
  }

  async processPayment(paymentData) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate payment processing with 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        data: {
          transactionId: `txn_${Date.now()}`,
          status: "completed"
        }
      };
    } else {
      return {
        success: false,
        error: "Payment failed. Please try again."
      };
    }
  }
}

export default new OrderService();