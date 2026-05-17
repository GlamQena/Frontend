import { useEffect, useState } from "react";
import axios from "axios";
import "./ActiveClients.css";
import { HiOutlineUser } from "react-icons/hi";
import { Star } from "lucide-react"; 
import { useTheme } from "../../../components/ThemeProvider";

function ActiveClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const getClients = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await axios.get(
          "http://127.0.0.1:8080/users/active-clients",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setClients(response.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    getClients();
  }, []);

  if (loading) {
    return <h2 className="loading">Loading...</h2>;
  }

  // ترتيب العملاء: الأعلى في إجمالي المشتريات (totalSpent) يظهر الأول فوق
  const sortedClients = [...clients].sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className={`active-container ${theme === "light" ? "light" : ""}`}>
      <div className="clients">
        <h1>العملاء المتفاعلين</h1>
        <p>العملاء الذين قاموا بطلبات من المتجر</p>
      </div>

      <div className="cards-container">
        {sortedClients.map((client) =>
          //لوب للكرار الكلاينت للتيست
          Array.from({ length: 9 }).map((_, index) => (
            <div className="client-card" key={`${client._id}-${index}`}>
              
              <div className="top">
                <div>
                  <h2>{client.fullName}</h2>
                  {/* شـرط الـ VIP: يظهر فقط لو المشتريات أكبر من 1000 جنيه */}
                  {client.totalSpent > 1000 && (
                    <span className="vip-badge">
                      <Star size={14} />
                      <span>عميل VIP</span>
                    </span>
                  )}
                </div>
                
                <div className="avatar">
                  <HiOutlineUser />
                </div>
              </div>

              <div className="info">
                <p>{client.phoneNumber}</p>
                <p>{client.email}</p>
              </div>

              <hr />

              <div className="stats">
                <div>
                  <span>إجمالي المشتريات</span>
                  <h3>{client.totalSpent} EGP</h3>
                </div>
                <div>
                  <span>عدد الطلبات</span>
                  <h3>{client.totalOrders}</h3>
                </div>
              </div>

              <div className="date">
                <span>آخر طلب:</span>
                <span>{new Date(client.lastOrderDate).toLocaleDateString()}</span>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActiveClients;