import { ToastContainer, Flip } from 'react-toastify';

// ==============================|| OVERRIDES - Toast ||============================== //
import React from 'react';

export default function ToastInit() {
    return <ToastContainer limit={2} transition={Flip} theme={"dark"} position={'bottom-right'} autoClose={8000} />;
}
