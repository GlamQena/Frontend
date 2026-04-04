import React, {useState, useEffect} from "react";

//TODO=> yub validations schema for the edit form
const Profile= ()=>{
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(null);
    const [formMessage, setFormMessage]= useState({success: false, message: ""});

    useEffect(()=>{
        loadUserData();
    }, []); //get the user profile data just when the component mount

    const loadUserData= async()=>{
        const user= localStorage.getItem("user");
        if(user){
            setFormData({...JSON.parse(user)});
            setLoading(false);
        }
        else
            await getUserProfile();

        console.log(formData);
    }

    const getUserProfile= async()=>{
        try{
            const response= await fetch("http://127.0.0.1:8080/profile/",{
                method: "GET",
                headers:{
                    "Content-Type": "application/json",
                },
                credentials: "include", //send browser cookies including accessToken
            });
            const data= await response.json();

            if(!response.ok)
                formMessageSetter(false, data.message);

            setFormData({...data.user});
            setLoading(false);
            localStorage.setItem("user", JSON.stringify(data.user));
            formMessageSetter(true, data.message);
        }catch(error){
            formMessageSetter(false, error.message);
        }
    }

    function formMessageSetter(success, message){
        setFormMessage({success, message});
        setTimeout(()=>{
            setFormMessage({success: false, message: ""});
        }, 4000);
    }

    //TODO=> method to fetch the endpoint /profile/edit when the user click "حفظ التغيرات" "onSubmit" and send the form data in the request body

    //TODO=> method to fetch the endpoint /profile/delete when the user click "حذف الحساب"

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
        setFormData(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [name]: checked }
        }));
        } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelection = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setFormMessage({success: false, message:"كلمة المرور غير متطابقة"});
        return;
        }

        try {
        const res = await fetch("http://127.0.0.1:8080/profile/edit", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(formData)
        });
        if (res.ok) setFormMessage({success: true, message:"تم حفظ التعديلات بنجاح "});
        else setFormMessage({success: false, message:"فشل التعديل"});
        } catch (err) {
        setFormMessage({success: false, message:"خطأ في الاتصال بالسيرفر"});
        }
    };

    if (loading) return <div className="loading">جاري تحميل البيانات...</div>;

    return(
        <div className="profile-page-wrapper" dir="rtl">
            <form onSubmit={handleSubmit}>
                {formMessage.message && <p className={formMessage.success? "success-message": "error-message"}>{formMessage.message}</p>}

                <div className="profile-content-grid">    
                    {/* 2. Right Side: Personal Info*/}
                    <main className="main-form-content">
                        {/*common personal data */}
                        <section className="form-card">
                            <h3>المعلومات الشخصية</h3>
                            <div className="inputs-grid">
                                <div className="input-field">
                                <label>الاسم بالكامل</label>
                                <input name="fullName" value={formData.fullName} onChange={handleChange} />
                                </div>
                                <div className="input-field">
                                <label>اسم المستخدم</label>
                                <input name="username" value={formData.username} onChange={handleChange} />
                                </div>
                                <div className="input-field">
                                <label>البريد الإلكتروني</label>
                                <input name="email" value={formData.email} onChange={handleChange} />
                                </div>
                                <div className="input-field">
                                <label>رقم الهاتف</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="gender-toggle">
                                <p>الجنس</p>
                                <button type="button" className={formData.gender === 'female' ? 'active' : ''} onClick={() => handleSelection('gender', 'female')}>أنثى</button>
                                <button type="button" className={formData.gender === 'male' ? 'active' : ''} onClick={() => handleSelection('gender', 'male')}>ذكر</button>
                            </div>

                            <div className="address-fields">
                                <h3>العنوان</h3>
                                <div className="address-inputs">
                                <input name="city" placeholder="قنا" onChange={handleChange} />
                                <input name="district" placeholder="حي الأندلس" onChange={handleChange} />
                                <input name="street" placeholder="شارع النيل" onChange={handleChange} />
                                </div>
                            </div>
                        </section>

                        {formData.role==="client" &&
                        <React.Fragment>
                            {/*additional client data */}
                            <section className="form-card skincare-section">
                                <h3>ملف العناية بالبشرة</h3>
                                <div className="skin-types">
                                    <p>نوع البشرة</p>
                                    {['جافة', 'دهنية', 'مختلطة', 'حساسة', 'عادية'].map(type => (
                                    <button 
                                        key={type} 
                                        type="button"
                                        className={formData.skinType === type ? 'chip active' : 'chip'}
                                        onClick={() => handleSelection('skinType', type)}
                                    >
                                        {type}
                                    </button>
                                    ))}
                                </div>
                                <div className="skin-interests">
                                    <p>الاهتمامات</p>
                                    {['حب الشباب', 'تجاعيد', 'جفاف', 'تصبغات', 'هالات سوداء'].map(item => (
                                    <button key={item} type="button" className="chip">{item}</button>
                                    ))}
                                </div>
                            </section>
                        </React.Fragment>}

                        {formData.role==="store_owner" &&
                        <React.Fragment>
                            {/*additional store_owner data */}
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
                        </React.Fragment>}

                        {formData.role==="admin" &&
                        <React.Fragment>
                            {/*additional admin data */}
                            <section className="info-card">
                                <h3>الصلاحيات الممنوحة</h3>
                                <div className="permissions-grid">
                                    {formData.permissions.map(perm => (
                                    <div key={perm.id} className="permission-item">
                                        <span>{perm.name}</span>
                                        <input type="checkbox" checked={perm.active} readOnly />
                                    </div>
                                    ))}
                                </div>
                            </section>
                        </React.Fragment>}
                    </main>
                </div>

                {/* 3. Left Side: Password & Notifications */}
                <aside className="sidebar-form-content">
                    <section className="form-card">
                    <h3>تفضيلات التنبيهات</h3>
                    <label className="checkbox-item">
                        <input type="checkbox" name="email" checked={formData.notifications.email} onChange={handleChange} />
                        البريد الإلكتروني
                    </label>
                    <label className="checkbox-item">
                        <input type="checkbox" name="app" checked={formData.notifications.app} onChange={handleChange} />
                        تنبيهات التطبيق
                    </label>
                    <label className="checkbox-item">
                        <input type="checkbox" name="sms" checked={formData.notifications.sms} onChange={handleChange} />
                        الرسائل النصية SMS
                    </label>
                    </section>

                    <section className="form-card">
                    <h3>تغيير كلمة المرور</h3>
                    <input type="password" name="currentPassword" placeholder="كلمة المرور الحالية" onChange={handleChange} />
                    <input type="password" name="newPassword" placeholder="كلمة المرور الجديدة" onChange={handleChange} />
                    <input type="password" name="confirmPassword" placeholder="تأكيد كلمة المرور" onChange={handleChange} />
                    </section>
                </aside>

                <div className="sticky-footer">
                    {formMessage.message && <p className="status-msg">{formMessage.message}</p>}
                    <button type="submit" className="btn-primary">حفظ التغييرات</button>
                    <button type="button" className="btn-secondary" onClick={getUserProfile}>إلغاء</button>
                </div>
            </form>
        </div>
    );
}

export default Profile;