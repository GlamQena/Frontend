import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/authService";
import OrdersList from "../../../components/OrdersList";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
       const res = await api.get("/order/admin");
        setOrders(res.data.data || []);
      } catch (err) {
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  return (
    <OrdersList
      orders={orders}
      loading={loading}
      headerTitle="إدارة الطلبات"
    />
  );
}