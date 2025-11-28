import axios from "axios";

// Fetch products
export const fetchProducts = async (shop, accessToken) => {
  const url = `https://${shop}/admin/api/2024-10/products.json`;

  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
    },
  });

  return res.data.products;
};

// Fetch customers
export const fetchCustomers = async (shop, accessToken) => {
  const url = `https://${shop}/admin/api/2024-10/customers.json`;

  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
    },
  });

  return res.data.customers;
};

// Fetch orders
export const fetchOrders = async (shop, accessToken) => {
  const url = `https://${shop}/admin/api/2024-10/orders.json`;

  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
    },
  });

  return res.data.orders;
};
