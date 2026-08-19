import { useEffect, useState } from "react";
import OrdersList from "../../components/OrdersList";
import "./Orders.css";
import "../../components/OrdersList.css";
import { getOrdersHistory } from "../../services/order";
import { responseMessageSetter } from "../../services/authService";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [responseMessage, setResponseMessage] = useState({success: false, message: ""});
const [loading, setLoading] = useState(true);
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const resData = await getOrdersHistory();
      console.log("fetchecd orders history => ",resData.data);
      setOrders(resData.data || []);
    } catch (err) {
      console.error(err);
      responseMessageSetter(false, err.message || "خطأ في جلب سجل الطلبات", setResponseMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => 
    {

    fetchOrders();

  }, []);

  const handleStatusChange = (id, status) => {
  setOrders(prev =>
    prev.map(o =>
      (o._id ) === id
        ? { ...o, status }
        : o
    )
  );
};

  return (
    <>
      <OrdersList
        orders={orders}
        onStatusChange={handleStatusChange}
        loading={loading}
        headerTitle="📦 طلباتي"
        onCancelSuccess={(orderId) => {
          if (orderId) {
            // cancel — just update status in state
            setOrders((prev) =>
              prev.map((o) =>
                o._id === orderId ? { ...o, status: "ملغي" } : o
              )
            );
          } else {
            // reorder — re-fetch all orders 
            fetchOrders();
          }
        }}
        
      />
    </>
  );
}