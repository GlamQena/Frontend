import { useEffect, useState } from "react";
import axios from "axios";

import OrdersList from "../../components/OrdersList";
import "./Orders.css";
import "../../components/OrdersList.css";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:8080/order/history", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setOrders(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, []);

  return (
    <>
      <OrdersList
        orders={orders}
        type="client"
        headerTitle="📦 طلباتي"
        onCancelSuccess={(orderId) => {
          setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? { ...o, status: "ملغي" } : o)),
          );
        }}
      />
    </>
  );
}
