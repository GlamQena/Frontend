import "./FloatingMsg.css";

export default function FloatingMsg({ success, message }) {
  return (
    <div
      className={`response-message ${success ? "success-message" : "error-message"}`}
    >
      {message}
    </div>
  );
}
