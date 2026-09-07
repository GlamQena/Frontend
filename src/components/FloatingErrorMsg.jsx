import "./FloatingErrorMsg.css";

export default function FloatingErrorMsg ({success, message}){
    return <div className={`response-message ${success ? "success-message" : "error-message"}`}>
            {message}
        </div>
}