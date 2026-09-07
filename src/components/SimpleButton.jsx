import "./SimpleButton.css";

export default function SimpleButton({content, onClick}) {
    return (
        <button 
            className="btn" 
            onClick={onClick}>
                {content}
        </button>
    );
}