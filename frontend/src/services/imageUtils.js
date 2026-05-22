
export const buildImgSrc = img => {
    if(img.includes("uploads"))
        return img.replace(/\\/g, "/").replace("uploads", "http://127.0.0.1:8080");
    else
      return img;
}