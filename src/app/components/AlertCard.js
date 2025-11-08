"use client";

import { useState, useEffect } from "react";
import { Redirect } from "../utils/Redirect";

export default function AlertCard({ AlertTitle, AlertDetail }) {
    const [show, setShow] = useState(true);

  
    return (

        <div className="w-screen h-screen flex items-center justify-center bg-gray-100 absolute z-999">

            <div className="bg-white shadow-lg rounded-2xl p-6 w-80 border border-gray-200 relative ">
                <h2 className="text-lg font-semibold text-gray-800">{AlertTitle}</h2>
                <p className="text-gray-600 mt-2">
                    {AlertDetail}
                </p>

                <button
                    onClick={() => setShow(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>

                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => Redirect()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
