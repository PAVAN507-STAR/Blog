// userAuthForm.page.jsx
import InputBox from "../components/input.component";
import googleicon from "../imgs/google.png";
import { Link } from "react-router-dom";
import Animate from "../common/page-animation";
import { useContext, useRef } from "react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { useLocation, Navigate } from "react-router-dom";
import { usercontext } from "../App";
import Cookies from "js-cookie";

const Userauth = ({ type }) => {
  const authForm = useRef();
  const path = useLocation();
  const {
    userauth: { accesstoken },
    setuserauth
  } = useContext(usercontext);

  const useauthserver = (serverroute, formdata) => {
    const serverUrl = import.meta.env.VITE_SERVER;
    if (!serverUrl) {
      console.error("Server URL is not defined");
      return toast.error("Server URL is missing");
    }

    axios
      .post(serverUrl + serverroute, formdata)
      .then(({ data }) => {
        setuserauth(data);
        Cookies.set("token", data.accesstoken, { expires: 30, secure: true });
        toast.success("Signed in successfully");
      })
      .catch((err) => {
        const errorMessage =
          err.response?.data?.error || "An unexpected error occurred";
        console.log(err);
        toast.error(errorMessage);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let serverroute = type === "signin" ? "/signin" : "/signup";

    let emailRegex =
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let passwordRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    const form = new FormData(authForm.current);
    let formdata = {};
    for (let [key, value] of form.entries()) {
      formdata[key] = value;
    }

    const { fullname, email, password } = formdata;

    if (path.pathname === "/signup") {
      if (fullname.length < 3) {
        return toast.error("Fullname must be at least 3 characters");
      }
    }

    if (!email.length) {
      return toast.error("Email cannot be empty");
    }

    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password must contain: length 6-20, a lowercase letter, an uppercase letter, and a number"
      );
    }
    if (!emailRegex.test(email)) {
      return toast.error("Invalid Email");
    }

    useauthserver(serverroute, formdata);
  };

  return accesstoken ? (
    <Navigate to="/" />
  ) : (
    <Animate key={type}>
      <section className="h-cover flex items-center justify-center">
        <Toaster />
        <form ref={authForm} className="w-[80%] mx-400">
          <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
            {type === "signin" ? "Welcome Back" : "Welcome aboard"}
          </h1>

          {type !== "signin" && (
            <>
              <InputBox
                name="fullname"
                type="text"
                placeholder="Fullname"
                icon="fi-br-user"
              />
              {/* New radio group to choose role */}
              <div className="flex flex-col my-4">
                <label className="text-lg font-semibold mb-2">
                  Sign up as:
                </label>
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="user_type"
                    value="user"
                    defaultChecked
                    className="mr-2"
                  />
                  <span className="mr-4">User</span>
                  <input
                    type="radio"
                    name="user_type"
                    value="author"
                    className="mr-2"
                  />
                  <span>Author</span>
                </div>
              </div>
            </>
          )}

          <InputBox
            name="email"
            type="email"
            placeholder="Email"
            icon="fi-sr-envelope"
          />
          <InputBox
            name="password"
            type="password"
            placeholder="Password"
            icon="fi-sr-key"
          />
          <button
            className="btn-dark center mt-14"
            onClick={handleSubmit}
            type="submit"
          >
            {type.replace("-", " ")}
          </button>

          <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <p>OR</p>
            <hr className="w-1/2 border-black" />
          </div>

          <button className="btn-dark flex items-center justify-center gap-4 w-[50%] center ">
            <img src={googleicon} className="w-5" alt="Google Icon" />
            Continue with Google
          </button>

          {type === "signin" ? (
            <p className="mt-6 text-dark-grey text-xl text-center">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="underline text-black text-xl ml-1"
              >
                Sign Up
              </Link>
            </p>
          ) : (
            <p className="mt-6 text-dark-grey text-xl text-center">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="underline text-black text-xl ml-1"
              >
                Sign In
              </Link>
            </p>
          )}
        </form>
      </section>
    </Animate>
  );
};

export default Userauth;
