import React, {useState, useEffect} from "react";

//TODO=> yub validations schema for the edit form
const Profile= ()=>{
    let role;
    const [formMessage, setFormMessage]= useState({success: false, message: ""});

    useEffect(()=>{
        getUserProfile();
    }, []); //get the user profile data just when the component mount

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

            role= data.role;
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

    return(
        <>

        <form>
            {formMessage.message && <p className={formMessage.success? "success-message": "error-message"}>{formMessage.message}</p>}

            {/*common personal data */}

            {role==="client" &&
            <React.Fragment>
                {/*additional client data */}
            </React.Fragment>}

            {role==="store_owner" &&
            <React.Fragment>
                {/*additional store_owner data */}
            </React.Fragment>}

            {role==="admin" &&
            <React.Fragment>
                {/*additional admin data */}
            </React.Fragment>}
        </form>
        </>
    );
}

export default Profile;