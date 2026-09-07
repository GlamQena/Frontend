import "./Pagination.css";
//exploring pages pagination
export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination-container">
            <button
                className="pagination-btn"
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                title="الصفحة السابقة"
            >
                ❮
            </button>
            
            <div className="pagination-dots">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        className={`pagination-dot ${currentPage === page ? "active" : ""}`}
                        onClick={() => onPageChange(page)}
                        title={`الانتقال إلى الصفحة ${page}`}
                    />
                ))}
            </div>

            <button
                className="pagination-btn"
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                title="الصفحة التالية"
            >
                ❯
            </button>
        </div>
    );
}