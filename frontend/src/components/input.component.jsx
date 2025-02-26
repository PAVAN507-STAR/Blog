import { useState } from "react";
const InputBox = ({ name, type, id, value, placeholder, icon }) => {
  const [passwordvisible,setpasswordvisible]=useState(false);
  return (
    <div className="relative w-full mb-4">
      <input
        name={name}
        type={type=="password"?passwordvisible?"text": "password":type}
        placeholder={placeholder}
        id={id}
        defaultValue={value}
        className="input-box w-full pr-10 center " // Add right padding for the icon
      />
      <i className={`fi ${icon} input-icon left-3`}></i>
      {type === "password" && (
          <i className={"fi fi-rr-eye"+(!passwordvisible?"-crossed":"") +" input-icon right-3 left-auto cursor-pointer"} onClick={()=>setpasswordvisible(currval=>!currval)}></i>
      )}
    </div>
  );
};

export default InputBox;