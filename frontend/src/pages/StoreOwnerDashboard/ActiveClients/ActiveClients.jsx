import { useEffect, useState } from "react";
import axios from "axios";
import "./ActiveClients.css";
import { HiOutlineUser } from "react-icons/hi";
import { Star } from "lucide-react"; 
import { useTheme } from "../../../components/ThemeProvider";
import { api } from "../../../services/authService";

function StoreOwnerActiveClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    const getClients = async () => {
      try {

        const response = await api.get(
          "http://127.0.0.1:8080/stores/me/active-clients",
        );
        console.log("active clients => ", response.data.data);
        setClients(response.data.data);

      } catch (error) {
        console.log(error);
        setErrorMessage(error.response.data.message || "خطأ فى جلب العملاء المتفاعلين");
        setTimeout(() => {
          setErrorMessage("");
        }, 5000);
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

      {errorMessage && <p class={`response-message ${errorMessage ? "error-message" : ""}`}>{errorMessage}</p>}

      <div className="cards-container">
        {sortedClients.map((client) => (
            <div className="client-card" key={`${client._id}`}>
              
              <div className="top">
                <div>
                  <h2>{client.fullName}</h2>
                  {/* شـرط الـ VIP: يظهر فقط لو المشتريات أكبر من 1000 جنيه */}
                  {(client.isVIP || client.totalSpent > 1000) && (
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
          )
        )}
      </div>
    </div>
  );
}

export default StoreOwnerActiveClients;