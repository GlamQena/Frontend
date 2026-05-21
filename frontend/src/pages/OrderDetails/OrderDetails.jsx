import MyOrderDetails from "../../components/OrderDetailsList";

export default function ClientOrderDetails() {
  return (
    <MyOrderDetails historyEndpoint="http://localhost:8080/order/history" />
  );
}
