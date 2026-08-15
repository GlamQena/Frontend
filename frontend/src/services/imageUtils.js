export const buildImgSrc = (img) => {
  if (img && img.includes("uploads")) {
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8080";
    return img.replace(/\\/g, "/").replace("uploads", apiBase);
  }
  return img;
};
