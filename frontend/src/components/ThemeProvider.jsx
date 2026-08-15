import {createContext, useContext, useState, useEffect} from "react";

const themeContext= createContext();

export const ThemeProvider= ({children})=>{
    const [theme, setTheme]= useState(()=>{
        const savedTheme = localStorage.getItem("Theme");
        return savedTheme || "dark";
    });

    useEffect(()=>{
        localStorage.setItem("Theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    return(
        <themeContext.Provider value={{theme, setTheme}}>
            {children}
        </themeContext.Provider>
    );
}

export const useTheme= ()=> useContext(themeContext);