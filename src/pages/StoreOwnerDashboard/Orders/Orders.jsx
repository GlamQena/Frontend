import "./Orders.css";
import { useEffect, useState } from "react";
import axios from "axios";
import OrdersList from "../../../components/OrdersList";
import "../../../components/OrdersList.css";
import { api } from "../../../services/authService";

const BASE_URL = "http://localhost:8080";

export default function StoreOwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
       const res = await api.get(`${BASE_URL}/order/`);
console.log("Orders fetched:", res.data);
setOrders(res.data.orders || []); 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);
    const handleStatusChange = (id, status) => {
  setOrders(prev =>
    prev.map(o =>
      (o.order_id) === id
        ? { ...o, status }
        : o
    )
  );
};

  return <OrdersList orders={orders} 
   onStatusChange={handleStatusChange}
    loading={loading}
  headerTitle="الطلبات" />;
}
