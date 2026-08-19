export const buildImgSrc = (imagePath) => {
    if (!imagePath) {
        return '/images/default-product.png';
    }
    
    // If it's already a Cloudinary URL
    if (imagePath.includes('cloudinary.com')) {
        return imagePath;
    }
    
    // If it's a full URL (http/https)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // If it's a local path from uploads
    if (imagePath.includes('uploads')) {
        // Replace backslashes with forward slashes
        let formattedPath = imagePath.replace(/\\/g, '/');
        // Remove any leading 'uploads/' to avoid duplication
        formattedPath = formattedPath.replace(/^uploads\//, '');
        // Return full URL with base
        return `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/uploads/${formattedPath}`;
    }
    
    // If it's just a filename
    if (!imagePath.startsWith('/')) {
        return `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/uploads/${imagePath}`;
    }
    
    // Default fallback
    return imagePath;
};
