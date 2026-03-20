

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { CheckCircle } from "lucide-react"; // استدعيت أيقونة واحدة كمثال
import "./Success.css";

function Verified() { 
  return (
   <div className="full-p">
    <div className="verified-container">
       <CheckCircle size={48} color="green" />
       
        {/*<img src="icons8-verified.gif" alt="err"/>*/}
       <h1>!تم التحقق بنجاح</h1>
       <p>تم تفعيل بريدك الالكتروني يمكنك الان تسجيل الدخول والاستمتاع بتجربة التسوق</p>
    </div>
   
    </div>
  );
}

export default Verified;
