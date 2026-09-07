import MyOrderDetails from "../../components/OrderDetailsList";

export default function ClientOrderDetails() {
  return (
    <MyOrderDetails historyEndpoint="https://glamqena-backend.vercel.app/order/history" />
  );
}