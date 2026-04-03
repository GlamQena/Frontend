// import React, {useState, useEffect} from "react";

// //TODO=> yub validations schema for the edit form
// const Profile= ()=>{
//     let role;
//     const [formMessage, setFormMessage]= useState({success: false, message: ""});

//     useEffect(()=>{
//         getUserProfile();
//     }, []); //get the user profile data just when the component mount

//     const getUserProfile= async()=>{
//         try{
//             const response= await fetch("http://127.0.0.1:8080/profile/",{
//                 method: "GET",
//                 headers:{
//                     "Content-Type": "application/json",
//                 },
//                 credentials: "include", //send browser cookies including accessToken
//             });
//             const data= await response.json();

//             if(!response.ok)
//                 formMessageSetter(false, data.message);

//             role= data.role;
//             formMessageSetter(true, data.message);
//         }catch(error){
//             formMessageSetter(false, error.message);
//         }
//     }

//     function formMessageSetter(success, message){
//         setFormMessage({success, message});
//         setTimeout(()=>{
//             setFormMessage({success: false, message: ""});
//         }, 4000);
//     }

//     //TODO=> method to fetch the endpoint /profile/edit when the user click "حفظ التغيرات" "onSubmit" and send the form data in the request body

//     //TODO=> method to fetch the endpoint /profile/delete when the user click "حذف الحساب"

//     return(
//         <>

//         <form>
//             {formMessage.message && <p className={formMessage.success? "success-message": "error-message"}>{formMessage.message}</p>}

//             {/*common personal data */}

//             {role==="client" &&
//             <React.Fragment>
//                 {/*additional client data */}
//             </React.Fragment>}

//             {role==="store_owner" &&
//             <React.Fragment>
//                 {/*additional store_owner data */}
//             </React.Fragment>}

//             {role==="admin" &&
//             <React.Fragment>
//                 {/*additional admin data */}
//             </React.Fragment>}
//         </form>
//         </>
//     );
// }

// export default Profile;


import React, { useState, useEffect } from 'react';

const Profile = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: '',
        address: '', 
        gender: '',
        skinType: '',
        
        storeName: '',
        storePhone: '',
        storeDescription: '',
        bankOwner: '',
        iban: '',
        bankName: 'البنك الأهلي المصري',
        
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const initialData = {
            "username": "semon__hany",
            "email": "semooohany@gmail.com",
            "role": "client",
            "address": "قنا - شارع النيل", // لو null في الباك اند هيتغير هنا
            "skinType": "normal",
            // ... باقي البيانات
        };
        
        setFormData(prev => ({
            ...prev,
            ...initialData,
            address: initialData.address || '' // حماية ضد الـ null
        }));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 4. إرسال البيانات للباك اند (تسميع التعديلات)
    const handleSave = async (e) => {
        e.preventDefault();

        // Validation بسيط
        if (formData.newPassword !== formData.confirmPassword) {
            alert("كلمات المرور الجديدة غير متطابقة!");
            return;
        }

        try {
            console.log("جاري الإرسال للباك اند...", formData);
            
            // الربط الفعلي مع السيرفر
            const response = await fetch('https://api.yourdomain.com/user/update', {
                method: 'PUT', // أو POST حسب الباك اند
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` 
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("تم حفظ جميع التعديلات بنجاح! ✅");
            } else {
                alert("حدثت مشكلة في الحفظ، راجعي السيرفر.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("فشل الاتصال بالباك اند.");
        }
    };

    return (
        <form dir="rtl" onSubmit={handleSave}>
            <section>
                <h3>البيانات الشخصية</h3>
                <input name="username" value={formData.username} onChange={handleChange} placeholder="اسم المستخدم" />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="البريد الإلكتروني" />
                <input name="address" value={formData.address} onChange={handleChange} placeholder="العنوان" />
                
                <select name="skinType" value={formData.skinType} onChange={handleChange}>
                    <option value="normal">Normal Skin</option>
                    <option value="oily">Oily Skin</option>
                    <option value="dry">Dry Skin</option>
                </select>
            </section>

            <hr />

            <section>
                <h3>بيانات المحل</h3>
                <input name="storeName" value={formData.storeName} onChange={handleChange} placeholder="اسم المتجر" />
                <textarea name="storeDescription" value={formData.storeDescription} onChange={handleChange} placeholder="وصف المتجر" />
            </section>

            <hr />

            <section>
                <h3>بيانات الحساب البنكي</h3>
                <input name="bankOwner" value={formData.bankOwner} onChange={handleChange} placeholder="اسم صاحب الحساب" />
                <input name="iban" value={formData.iban} onChange={handleChange} placeholder="IBAN" />
            </section>

            <hr />

         
            <section>
                <h3>أمان الحساب</h3>
                <input type="password" name="currentPassword" onChange={handleChange} placeholder="الباسورد الحالي" />
                <input type="password" name="newPassword" onChange={handleChange} placeholder="الباسورد الجديد" />
                <input type="password" name="confirmPassword" onChange={handleChange} placeholder="تأكيد الباسورد" />
            </section>

            {/* الأزرار */}
            <div style={{ marginTop: '20px' }}>
                <button type="submit">حفظ التغييرات</button>
                <button type="button">إلغاء</button>
            </div>
        </form>
    );
};

export default Profile;