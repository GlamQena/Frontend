import "./Orders.css";
import { useEffect, useState } from "react";
import axios from "axios";
import OrdersList from "../../../components/OrdersList";
import "../../../components/OrdersList.css";

const BASE_URL = "http://localhost:8080";

export default function StoreOwnerOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/order/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, []);

  return <OrdersList orders={orders} type="store" headerTitle="الطلبات" />;
}
